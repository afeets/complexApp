const { reject } = require("async")
const validator = require("validator")
const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection("users")
const md5 = require('md5')

let User = function(data, getAvatar){
    this.data = data
    this.errors = []
    if(getAvatar == undefined){ getAvatar = false}
    if(getAvatar){this.getAvatar()}
}

User.prototype.cleanUp = function(){
    // only accept string datatypes
    if (typeof(this.data.username) != "string"){ this.data.username = ""}
    if (typeof(this.data.email) != "string"){ this.data.email = ""}
    if (typeof(this.data.password) != "string"){ this.data.password = ""}

    // get rid of bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password,
    }
}

User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if(this.data.username == ""){
            this.errors.push("You must provide username")
        }
    
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
            this.errors.push("Username can only contain letters and numbers")
        }
    
        if(!validator.isEmail(this.data.email)){
            this.errors.push("You must provide valid email")
        }
    
        if(this.data.password == ""){
            this.errors.push("You must provide password")
        }
    
        if(this.data.password.length > 0 && this.data.password.length < 12){
            this.errors.push("Password must be at least 12 Characters")
        }
    
        if(this.data.password.length > 50){
            this.errors.push("Password cannot exceed 50 Characters")
        }
        
        if(this.data.username.length > 0 && this.data.password.length < 3){
            this.errors.push("Username must be at least 3 Characters")
        }
    
        if(this.data.username.length > 30){
            this.errors.push("Username cannot exceed 30 Characters")
        }
    
        // only if Username valid check if already taken
        if( this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await usersCollection.findOne({ username: this.data.username })
            if (usernameExists){ this.errors.push('That username is already taken') }
        }
    
        // only if Email valid check if already taken
        if( validator.isEmail(this.data.email)){
            let emailExists = await usersCollection.findOne({ email: this.data.email })
            if (emailExists){ this.errors.push('That email address is already taken') }
        }
        // call to signify promise completed
        resolve()
    })
}

User.prototype.register = function(){
    return new Promise(async (resolve, reject) => {
        // Step 1: Validate User Data
        this.cleanUp()
    
        // async calls return promise
        await this.validate()
    
        // Step 2: Only if no validation errors, save data to DB
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        }
        else{
            reject(this.errors)
        }  
    })
}

// Using Callback Function
/*
User.prototype.login = function(callback){
    // Validate User Data
    this.cleanUp()
    usersCollection.findOne({ username: this.data.username }, (err, attemptedUser) => {
        if(attemptedUser && attemptedUser.password == this.data.password){
            callback('Congrats')
        }
        else {
            callback('Invalid')
        }
    })
}
*/

// Using Promise
User.prototype.login = function(){
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({ username: this.data.username}).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync( this.data.password, attemptedUser.password)) {
                // get access to users email address
                this.data = attemptedUser
                this.getAvatar()
                resolve('Congrats')
            }
            else {
                reject ('Invalid Credentials')
            }
        }).catch(function(){
            reject('Please try again later')
        })
    })
}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username){
    return new Promise(function(resolve, reject){
        if(typeof(username) != "string"){
            reject()
            return
        }
        usersCollection.findOne({ username: username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function(){
            reject()
        })
    })
}

User.doesEmailExist = function(email){
    return new Promise(async function(resolve, reject){
        if(typeof(email) !='string'){
            resolve(false)
            return
        }
        let user = await usersCollection.findOne({ email: email })
        if (user){
            resolve(true)
        }
        else {
            resolve(false)
        }
    })
}

module.exports = User