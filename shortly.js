var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var _ = require('./public/lib/underscore.js');

var db = require('./app/config');
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

// app.post('/signup'

// );

// app.post('/login'

// );


app.get('/logout',
  (req, res) => {
    if (req.session.user) {
      req.session.destroy();
    }
    res.redirect('/');
  });

app.get('/', authenticate,
function(req, res) {
  res.render('index');
});

app.get('/login', 
  function(req, res) {
    res.render('login');
  });

app.get('/create', authenticate,
function(req, res) {
  res.render('index');
});

app.get('/signup', (req, res) => res.render('signup') );

app.get('/links', authenticate,
function(req, res) {
  Links.reset().fetch().then(function() {
    Link.where({userId: req.session.userId}).fetchAll()
      .then(function(links) {
        if (links) {
          res.status(200).send(links);
        } else {
          res.status(200);
        }
      });
  });

});


app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri, userId: req.session.userId })
    .fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin,
            userId: req.session.userId
          })
          .then(function(newLink) {
            res.status(200).send(newLink);

          });
        });
      }
    });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0], userId: req.session.userId }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
