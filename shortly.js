var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var _ = require('./public/lib/underscore.js');

var db = require('./app/config');
var dm = require('./helpers/dataManager.js');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var app = express();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'cat',
  resave: true,
  saveUninitialized: true
}));



app.post('/signup', dm.signup);
app.post('/login', dm.login);
app.post('/links', dm.manageLinks.createLink);

app.get('/logout', dm.logout);
app.get('/signup', (req, res) => res.render('signup') );
app.get('/login', (req, res) => res.render('login') );
app.get('/', dm.authenticate, (req, res) => res.render('index') );
app.get('/create', dm.authenticate, (req, res) => res.render('index') );
app.get('/links', dm.authenticate, dm.manageLinks.fetchLinks);
app.get('/*', dm.manageLinks.handleClicks);


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/



console.log('Shortly is listening on 4568');
app.listen(4568);
