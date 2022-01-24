const Post = require('../models/Post')

exports.viewCreateScreen = function (req, res){
    res.render('create-post')
}

exports.create = function (req, res){
    let post = new Post(req.body, req.session.user._id)
    // setup promise
    post.create().then(function(newId){
        // res.send("New Post created")
        req.flash("success", "New post successfully created")
        req.session.save(() => res.redirect(`/post/${newId}`))
    }).catch(function(err){
        // res.send(err)
        errors.forEach((error) => { req.flash("errors", error)})
        req.session.save(() => { res.redirect("/create-post")})
    })
}


exports.apiCreate = function (req, res){
    let post = new Post(req.body, req.apiUser._id)
    // setup promise
    post.create().then(function(newId){
        res.json('Congrats')
    }).catch(function(err){
        res.json(err)
    })
}



exports.viewSingle = async function(req, res){
    // res.render('single-post-screen')
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post, title: post.title })
    } catch {
        // res.send("404 template will go here")
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id)
        if( post.isVisitorOwner){
            res.render("edit-post", { post: post})
        } else {
            req.flash("errors","You do not have permission to perform that action")
            req.session.save(() => res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.edit = function(req, res){
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then(
        (status) => {
            // post successfully updated in DB
            // or user did have permission, but there were validation errors
            if (status == "success"){
                // post was updated in DB
                req.flash("success", "Post successfully updated")
                req.session.save(function(){
                    res.redirect(`/post/${req.params.id}/edit`)
                })
            }
            else {
                post.errors.forEach(function(error){
                    req.flash("errors", error)
                })
                req.session.save(function(){
                    res.redirect(`/post/${req.params.id}/edit`)
                })
            }
        }
    ).catch(
        () => {
            // post with requested id doesnt exist
            // current visitor is not owner of requested post
            req.flash("errors","You do not have permission to perform action.")
            req.session.save(function(){
                res.redirect("/")
            })
        }
    )
}

exports.delete = function( req, res){
    Post.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success","Post successfully deleted")
        req.session.save(() => { res.redirect(`/profile/${req.session.user.username}`) })
    }).catch(() => {
        req.flash("errros","You do not have permission to perform this action")
        req.session.save(() => { res.redirect('/')})
    })
}


exports.apiDelete = function( req, res){
    Post.delete(req.params.id, req.apiUser._id).then(() => {
        res.json("Success")
    }).catch(() => {
        res.json("You do not have permission to perform this action")
    })
}



exports.search = function (req, res){
    Post.search( req.body.searchTerm ).then((posts) => {
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}