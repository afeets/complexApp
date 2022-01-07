const express = require('express')
const session = require('express-session')
const mongoStore = require('connect-mongo')
const flash = require('connect-flash')
const app = express()

let sessionOptions = session({ 
    secret: "Javascript is so cool",
    store: mongoStore.create({ client: require('./db') }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
})

app.use(sessionOptions)
app.use(flash())

const router = require('./router')

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'templates')
app.set('view engine', 'ejs')

app.use('/', router)

// app.listen(3000)

module.exports = app