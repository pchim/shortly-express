var express = require('express');
var util = require('../lib/utility');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var _ = require('../public/lib/underscore.js');

var db = require('../app/config');
var dm = require('../helpers/dataManager.js');
var Users = require('../app/collections/users');
var User = require('../app/models/user');
var Links = require('../app/collections/links');
var Link = require('../app/models/link');
var Click = require('../app/models/click');
var app = express();


var dataManager = {
  authenticate: (req, res, next) => {
    if (req.session.userId !== undefined) {
      next();
    } else {
      req.session.error = 'Login Required';
      res.redirect('/login');
    }
  },
  validateSignup: (req, res) => {
    if (req.body.username === undefined || req.body.password === undefined) {
      console.log('Not a valid username/password ');
      return res.redirect('/signup');
    }
  },
  validateLogin: (req, res) => {
    if (req.body.username === undefined || req.body.password === undefined) {
      console.log('Username/password not found ');
      return res.redirect('/login');
    }
  },
  signup: (req, res) => {
    dataManager.validateSignup(req, res);
    // check if username exists
    new User({ username: req.body.username })
      .fetch()
      .then(function(found) {
        if (found) {
          console.log('Username taken');
          res.status(200);
          res.redirect('/');
        } else { 
          userData.createUser(req, res);
        }
      });
  },
  login: (req, res) => {
    dataManager.validateLogin(req, res);
    // check if username exists
    User.where({'username': req.body.username})
      .fetch()
      .then( fetchedUser => {
        if (fetchedUser) {
          req.fetchedUser = fetchedUser;
          userData.loginUser(req, res); 
        } else {
          console.log('Cannot find user');
          res.status(401);
          res.redirect('/login'); 
        }            
      });
  },
  logout: (req, res) => {
    if (req.session.user) {
      req.session.destroy();
    }
    res.redirect('/');
  } 
};

var userData = {
  createUser: (req, res) => {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(req.body.password, salt, null, function(err, hash) {
        Users.create({
          username: req.body.username,
          hash: hash
        })
        .then(function(newUser) {
          req.session.regenerate( () => {
            req.session.user = newUser.get('username');
            req.session.userId = newUser.get('id');
            res.redirect('/');
          });
        });            
      });
    });   
  },
  loginUser: (req, res) => {
    bcrypt.compare(req.body.password, req.fetchedUser.get('hash'), function(err, hashMatch) {
      if (hashMatch) {
        console.log('Login successful');
        req.session.regenerate( () => {
          res.headers = {location: '/'};
          req.session.user = req.fetchedUser.get('username');
          req.session.userId = req.fetchedUser.get('id');
          res.status(200);
          res.redirect('/');
        });
      } else {
        console.log('Invalid password');
        delete req.fetchedUser;
        res.status(401);
        res.redirect('/login'); 
      }
    });
  },
  createLink: (req, res) => {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri, userId: req.session.userId }).fetch().then( found => {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, (err, title) => {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin,
            userId: req.session.userId
          }).then( newLink => res.status(200).send(newLink) );
        });
      }
    });
  },
  fetchLinks: (req, res) => {
    Links.reset().fetch().then( () => {
      Link.where({userId: req.session.userId}).fetchAll()
        .then(function(links) {
          if (links) {
            console.log('Links fetched successfully');
            res.status(200).send(links);
          } else {
            console.log('No links found ');
            res.status(200);
          }
        });
    });
  },
  handleClicks: (req, res) => {
    new Link({ code: req.params[0], userId: req.session.userId }).fetch().then( link => {
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
  }  
};

var manageLinks = {
  fetchLinks: userData.fetchLinks,
  createLink: userData.createLink,
  handleClicks: userData.handleClicks   
};

module.exports = dataManager; 
module.exports.manageLinks = manageLinks;