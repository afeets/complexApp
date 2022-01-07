const { reject } = require("async")
const validator = require("validator")
const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection("users")

let User = function(data){
    this.data = data
    this.errors = []
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

}


User.prototype.register = function(){
    // Step 1: Validate User Data
    this.cleanUp()
    this.validate()

    // Step 2: Only if no validation errors, save data to DB
    if (!this.errors.length) {
        // hash user password
        let salt = bcrypt.genSaltSync(10)
        this.data.password = bcrypt.hashSync(this.data.password, salt)
        usersCollection.insertOne(this.data)
    }
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

module.exports = User