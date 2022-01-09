const Post = require('../models/Post')

exports.viewCreateScreen = function (req, res){
    res.render('create-post')
}

exports.create = function (req, res){
    let post = new Post(req.body, req.session.user._id)
    // setup promise
    post.create().then(function(){
        res.send("New Post created")
    }).catch(function(err){
        res.send(err)
    })
}

exports.viewSingle = async function(req, res){
    // res.render('single-post-screen')
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
    } catch {
        // res.send("404 template will go here")
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id)
        res.render("edit-post", { post: post})
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