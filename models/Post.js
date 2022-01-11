const postsCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userId, requestedPostId){
    this.data = data
    this.errors = []
    this.userId = userId
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){ this.data.title = ""}
    if(typeof(this.data.body) != "string"){ this.data.body = ""}

    // get rid of bogus properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
        createdDate: new Date(),
        author: ObjectId(this.userId)
    }
}


Post.prototype.validate = function(){
    if(this.data.title == ""){ this.errors.push("You must provide a title")}
    if(this.data.body == ""){ this.errors.push("You must provide post content")}
}


Post.prototype.create = function(){
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()

        if(!this.errors.length){
            // save post into DB
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.insertedId)
            }).catch(() => {
                this.errors.push("Please try again later")
                reject(this.errors)
            })
            
        }else{
            // errors found
            reject(this.errors)
        }
    })
}

Post.prototype.update =function(){
    return new Promise(async(resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userId)

            // if
            if(post.isVisitorOwner){
                // Update the DB return success / failure
                let status = await this.actuallyUpdate()
                resolve(status)
            }
            else {
                reject()
            }
        }
        catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async(resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            await postsCollection.findOneAndUpdate( {_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body }})
            resolve("success")
        }
        else {
            resolve("failure")
        }
    })    
}

Post.reusablePostQuery = function(uniqueOperations, visitorId){
    return new Promise(async function(resolve, reject){
        
        // let post = await postsCollection.findOne({ _id: new ObjectId(id)})
        let aggOperations = uniqueOperations.concat([
            {$lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" }},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        // required to get user object properties, use aggregate to 
        // run multiple operations
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // cleanup author property in each post object
        posts = posts.map(function(post){
            // return true / false 
            post.isVisitorOwner = post.authorId.equals(visitorId)

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }

            return post
        })

        resolve(posts)       
    })
}

Post.findSingleById = function(id, visitorId){
    return new Promise(async function(resolve, reject){
        if(typeof(id) != "string" || !ObjectId.isValid(id) ){
            reject()
            return
        }
        
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        if(posts.length){
            console.log(posts[0])
            resolve(posts[0])
        }
        else {
            reject()
        }

        if(posts){
            resolve(posts)
        } 
        else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId){
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}



module.exports = Post