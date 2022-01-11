const usersColllection = require('../db').db().collection("users")
const followsColllection = require('../db').db().collection("follows")
const ObjectId = require('mongodb').ObjectId

let Follow = function(followedUsername, authorId){
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanup = function(){
    if(typeof(this.followedUsername) != "string"){ this.followedUsername = "" }
}

Follow.prototype.validate = async function(){
    // followedUsername must exist in DB
    let followedAccount = await usersColllection.findOne({ username: this.followedUsername })
    if (followedAccount) {
        this.followedId = followedAccount._id
    } 
    else {
        this.errors.push("You cannot follow a user that does not exist")
    }
}


Follow.prototype.create = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate()
        if (!this.errors.length){
            await followsColllection.insertOne({ followedId: this.followedId, authorId: new ObjectId(this.authorId) })
            resolve()
        }
        else {
            reject(this.errors)
        }
    })
}

module.exports = Follow