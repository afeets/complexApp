const User = require('../models/User')


// using Callback Function
/*
exports.login = function(req, res){
    let user = new User(req.body)
    user.login(function(result){
        res.send(result)
    })
}
*/

// using Promise 
exports.login = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
        req.session.user = { avatar: user.avatar, username: user.data.username }
        // res.send(result)
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch(function(err){
        req.flash('errors', err)
        // adds to req.session.flash.errors = [err]
        // res.send(err)
        // res.redirect('/')
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        // user is logged in so, move to the next called function 
        next()
    }
    else{
        req.flash("errors","You must be logged in to perform that action")
        req.session.save(function(){
            res.redirect('/')
        })
    }
}

exports.logout = function(req, res){
    // callback function to redirect to homepage
    req.session.destroy(function(){
        res.redirect('/')
    })
    // res.send('You are now logged out')
    
}

exports.register = function(req, res){
    let user = new User(req.body)
    user.register().then(() => {
        req.session.user = { avatar: user.avatar, username: user.data.username }
        // manually save session and log user into app once registered
        req.session.save(function(){ 
            res.redirect('/')
        })
    }).catch((regErrors) => {
        // work with validation errors
        regErrors.forEach(function(err){
            req.flash('regErrors', err)
        })
        // manually save session
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.home = function(req, res){
    if( req.session.user ){
        res.render('home-dashboard')
    }
    else {
        // req.flash will send contents of errors, and then delete from session
        res.render('home-guest', { errors: req.flash('errors'), regErrors: req.flash('regErrors')})
    }
}