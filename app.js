/**
**GitWar V0.1
Written by RaShaun Jones
**/


/**
 * Module dependencies.
 */
var fs = require('fs');
//MongoDB Imports
var graph = require('fbgraph');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');
var express = require('express')
  , routes = require('./routes');
var BSON = require('mongodb').BSONPure;
var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , GitHubStrategy = require('passport-github').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy;



var GITHUB_CLIENT_ID = "a78ec387014f096f3bef";
var GITHUB_CLIENT_SECRET = "5f03c2c151a73d14e08a492ab3d451814bfb4d7a";
var FACEBOOK_ID = "689992837785802";
var FACEBOOK_SECRET = "701d276109bc367c139271441b9d229f";

//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
var guser  ={};
var mongoclient = new MongoClient(new Server('localhost', 27017), {native_parser: true});
passport.serializeUser(function(user, done) {
  
  console.log(user);
  createUser(user);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {

  done(null, obj);
});


// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://104.131.81.171/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_ID,
    clientSecret: FACEBOOK_SECRET,
    callbackURL: "http://104.131.81.171/auth/facebook/callback",
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
    graph.setAccessToken(accessToken);
    var wallPost = {
  message: "I just signed up for GitWar. The clock has begun ticking."
  };

  graph.post("/feed", wallPost, function(err, res) {
  // returns the post id
  console.log(res); // { id: xxxxx}
});
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


var app = express.createServer();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHubwill redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
  passport.authenticate('github',{failureRedirect : '/login'}),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/home');
    
  });

app.get('/auth/facebook',
  passport.authenticate('facebook',{failureRedirect : '/login'}),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/home');
    
  });

app.get('/home',
  function(req, res) {
    res.render('home');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(80, function(){
  console.log("GitWars is now running on port: " + app.address().port);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

//Create MongoDB Object
function createUser(user){
mongoclient.open(function(err,mongoclient){
  console.log("Successfully connected to GitWarDB");
  //console.log(user);
  var db = mongoclient.db('GitWars');
  var users = db.collection('users');
  var name = user.username;
  users.findOne({user: name}, function(err, result) {
    if (err) { /* handle err */ }

    if (result) {
        console.log("FOUND A RESULT");
         updateUser(user);
    } 
    else {
    var output = JSON.stringify(user);
    //console.log(output);
    users.insert({user: user.username,
    url :user._json.url,
    avatar_url : user._json.avatar_url,
    email: user._json.email,
    public_gists: user._json.public_gists,
    public_repos: user._json.public_repos,
    followers: user._json.followers,
    following: user._json.following,
    updated_at: user._json.updated_at,
    }, function(err,doc){
    //console.log(user);
      console.log("Following entity has been inserted into collection " + user.username);
      db.close();
    });
    }
});
  db.close();
  });

};

function updateUser(user){
console.log("Entered update function");
  mongoclient.open(function(err,mongoclient){

  //console.log(user);
  var db = mongoclient.db('GitWars');
  var users = db.collection('users');

  var name = user.username;

  users.update({user: user.username},{followers: 200});
  db.close();
 });
}

function ranking(user){
mongoclient.open(function(err,mongoclient){
  console.log("Successfully connected to GitWarDB");
  //console.log(user);
  var db = mongoclient.db('GitWars');
  var users = db.collection('users');
  var name = user.username;
  users.findOne({user: name}, function(err, result) {
    if (err) { /* handle err */ }

    if (result) {
        console.log("Got user list");
         updateUser(user);
    } 
    else {
    var output = JSON.stringify(user);
    //console.log(output);
    users.find({}, function(err,doc){
    //console.log(user);
      console.log("Following entity has been inserted into collection " + user.username);
      db.close();
    });
    }
});
  db.close();
  });

};