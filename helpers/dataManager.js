
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
    if (!(req.body.username && req.body.password)) {
      console.log('Not a valid username/password ');
      res.redirect('/signup');
    }
  },
  signup: (req, res) => {
    validateSignup(req, res);

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
    if (!(req.body.username && req.body.password)) {
      return;
    }

    User.where({'username': req.body.username})
      .fetch().then( userData => {
        if (userData) {
          bcrypt.compare(req.body.password, userData.get('hash'), function(err, hashMatch) {
            if (hashMatch) {
              req.session.regenerate( () => {
                res.headers = {location: '/'};
                req.session.user = userData.get('username');
                req.session.userId = userData.get('id');
                res.status(201);
                res.redirect('/');
              });
            } else {
              res.status(201);
              res.redirect('/login'); 
            }
          });         
        } else {
          res.status(201);
          res.redirect('/login'); 
        }            
      });
  },  
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
};
