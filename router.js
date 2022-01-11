const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')

/* 
router.get('/', function(req, res){
    res.render('home-guest')
})
 */

router.get('/', userController.home )

router.post('/register', userController.register )

router.post('/login', userController.login)

router.post('/logout', userController.logout)

// Profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen)

// Post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)

router.post('/create-post', userController.mustBeLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)


module.exports = router