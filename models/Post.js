const postsCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')

let Post = function(data, userId){
    this.data = data
    this.errors = []
    this.userId = userId
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){ this.data.title = ""}
    if(typeof(this.data.body) != "string"){ this.data.body = ""}

    // get rid of bogus properties
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
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
            postsCollection.insertOne(this.data).then(() => {
                resolve()
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

Post.findSingleById = function(id){
    return new Promise(async function(resolve, reject){
        if(typeof(id) != "string" || !ObjectId.isValid(id) ){
            reject()
            return
        }
        
        // let post = await postsCollection.findOne({ _id: new ObjectId(id)})
        
        // required to get user object properties, use aggregate to 
        // run multiple operations
        let posts = await postsCollection.aggregate([
            {$match: { _id: new ObjectId(id)}},
            {$lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" }},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                author: {$arrayElemAt: ["$authorDocument", 0]}

            }}
        ]).toArray()


        // cleanup author property in each post object
        posts = posts.map(function(post){
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }

            return post
        })

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

module.exports = Post