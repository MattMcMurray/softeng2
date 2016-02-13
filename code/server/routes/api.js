var _express = require('express');

var router = _express.Router();
var app = _express();
var User = require('../models/User.js');
var UserMatches = require('../models/UserMatches.js');
var authenticator = require("../mixins/authenticator.js");

var injectUser = function(user) {
	if (user) {
		User = user;
	}
};

var injectLikes = function(likes) {
	if (likes) {
		UserMatches = likes;
	}
};

router.get('/', function (req, res) {
	res.json({message: 'Hello world!'});
});

router.post('/NewUser', function (req, res) {
    if (req.body.password === req.body.confirmPassword) {
        User.createUser(getCredentials(req)).then(function(data){
            console.log('New user ' + req.body.username + ' created');
            res.json({url:"/", message: 'New user created'});
        }).catch(function(error){
            res.status(500);
            res.json(error);
        });
    } else {
        res.status(400).json({'msg': 'Passwords do not match'});
    }
});

router.post('/ProfileUpdate', function (req, res) {
	User.createUserProfile(getProfileDate(req));
	console.log('User ' + req.body.username + ' profile updated');
	res.json({url:"/", message: 'User profile updated'});
});

router.post("/login", function(req,res) {
	
	credentials = getCredentials(req)
	
	User.getUser(credentials.username).then(function(user){
		if (user != null && authenticator.authenticate(credentials.password, user.dataValues.password)){
      
			res.json({ url: "/main", user: user });
		} else {
			res.status(500)
			res.json({message: "Oops! Something went wrong. Invalid username/password."});
		}
	});
});


// Get a random user; useful for matching process
router.get('/randomUser', function(req, res){
	User.getRandom(req.query.currUserId).then(function(user) {
		if (user != null) {
			res.json({username: user.username, userID: user.id, school: user.school, firstname: user.firstname, lastname: user.lastname, helpDescription: user.helpDescription})	
		} else {
			res.json({message: "Something went wrong"});
		}
		
	});
});

router.get('/getPotentialMatches', function(req, res){
	UserMatches.getMatches(req.query.userId).then(function(ids){
		User.getUsersById(ids).then(function(users) {
			res.json({matches: users});
		});
	});
});

router.post('/likeUser', function(req, res){
	UserMatches.addUserMatch(req.body.liker_id, req.body.likee_id, true).then(function(result) {
		if (result.error) 
			res.status(500);

		res.json(result);
	});
});


router.post('/dislikeUser', function(req, res){
	UserMatches.addUserMatch(req.body.liker_id, req.body.likee_id, false).then(function(result) {
		if (result.error) 
			res.status(500);
		
		res.json(result);
	});
});

// Getting a specific user
// Specify username in GET variable
router.get('/getUser', function(req, res) {

    if (req.query.user) {
        User.getUser(req.query.user).then(function(user) {
            if (user && user.dataValues) {
              delete user.dataValues.password; // probably not the best idea to send this over the wire
              res.json({user: user.dataValues});
            } else {
              res.json({user: null});
            }
        });
    } else {
        res.sendStatus(401); // bad request; no user included in GET vars
    }
});

router.post('/deleteUser', function(req, res) {
	console.log('received: ' + req.body.userId);
	UserMatches.removeUser(req.body.userId);
	User.removeUser(req.body.userId);
	res.json({
		url: '/'
	})
});

function getCredentials(req){
	return {username: req.body.username, password: req.body.password};
}

function getProfileDate(req) {
	return {username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, 
		address: req.body.address, city: req.body.city, country: req.body.country, school: req.body.school, 
		courses: req.body.courses, generalDescription: req.body.generalDescription, helpDescription: req.body.helpDescription, 
		dateOfBirth: req.body.dateOfBirth};
}

module.exports = {
	router,
	injectUser: injectUser,
	injectLikes: injectLikes,
};
