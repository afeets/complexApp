const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')


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
        req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id  }
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

exports.sharedProfileData = async function (req, res, next){
    let isVisitorsProfile = false
    let isFollowing = false

    // if user is logged in
    if(req.session.user){
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing
    next()
}


exports.register = function(req, res){
    let user = new User(req.body)
    user.register().then(() => {
        req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id }
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
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

exports.ifUserExists = function(req, res, next){
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument
        next()
    }).catch(function(){
        res.render("404")
    })
}

exports.profilePostsScreen = function(req, res){
    // ask our Post model for post by author ID
    Post.findByAuthorId(req.profileUser._id).then(function(posts){
        res.render('profile', {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile
        })
    }).catch(function(){
        res.render("404")
    })    
}


exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id)
        res.render('profile-followers', {
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile
        })
    } catch {
        res.render("404")
    }
}