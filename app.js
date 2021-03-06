const express = require('express')
const session = require('express-session')
const mongoStore = require('connect-mongo')
const flash = require('connect-flash')
const csrf = require('csurf')
const app = express()
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')


app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/api', require('./router-api'))

let sessionOptions = session({ 
    secret: "Javascript is so cool",
    store: mongoStore.create({ client: require('./db') }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
})

app.use(sessionOptions)
app.use(flash())

// run this function for every request
app.use(function(req, res, next){
    // make markdown function available within ejs templates
    res.locals.filterUserHTML = function(content){
        // return markdown.parse(content)
        return sanitizeHTML(markdown.parse(content), { allowedTags: ['p','br','ul','li','ol','strong','bold','i','em','h1','h2','h3','h4'], allowedAttributes: [] })
    }

    // make all error / success flash messages available
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on req object
    if(req.session.user){ req.visitorId = req.session.user._id} else { req.visitorId = 0 }

    // make user session data available from within templates
    res.locals.user = req.session.user
    next()
})

const router = require('./router')

app.use(express.static('public'))
app.set('views', 'templates')
app.set('view engine', 'ejs')

// require a valid csrf token to complete post put update requests
app.use(csrf())

// setup middleware
app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)

app.use(function(err, req, res, next){
    if(err){
        if(err.code == "EBADCSRFTOKEN"){
            req.flash('errors', 'Cross site request forgery detected')
            req.session.save(() => res.redirect('/') )
        }
        else {
            res.render("404")
        }
    }
})

// app.listen(3000)

const server = require('http').createServer(app)

// add socket functionality
const io = require('socket.io')(server)

io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket){
    if(socket.request.session.user){
        let user = socket.request.session.user

        socket.emit('welcome', { username: user.username, avatar: user.avatar })
        socket.on('chatMessageFromBrowser', function(data){
            // console.log(data.message)
            // send out to all connected users
            // sanitize message
            socket.broadcast.emit('chatMessageFromServer', { message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar })
        })    
    }
})

module.exports = server