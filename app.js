var express = require('express');
var randomstring = require('randomstring');
var User = require('./api/models/user.js');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var Memcached = require('memcached');
var memcached = new Memcached();
memcached.connect('127.0.0.1:11211', (err, connc)=> {
  if (err) {
    console.log('in error');
    console.log(err);
  }
  console.log('memcache server build..'+connc);
});

app.use(cookieParser());

var bcrypt = require('bcrypt');


var mongoose = require("mongoose");

var jwt = require('jsonwebtoken');

var session = require('express-session');
// app.use(session({
// 	secret:process.env.SESSION_KEY,
// 	resave:false,
// 	saveUninitialized:true,

// }))

var jwtKey = randomstring.generate(16);

// function getCookie(cookie, key, callback) {
//   var value = "; " + cookie;
//   var parts = value.split("; " + key + "=");
//   console.log(parts);
//   if (parts.length == 1) {
//     callback({
//       cookieExists: false,
//       token: ''
//     });
//     return;
//   }
//
//   callback({
//     cookieExists: true,
//     token: parts[1].split(';')[0]
//   });
// }

//verify Token middileware
var verifytoken = function(req, res, callback) {
  if (!req.cookies.smlCookie) {
    res.send({
      status: false,
      msg: 'Unauthorized access'
    });
    return;
  }

  jwt.verify(req.cookies.smlCookie, jwtKey, (err, decoded) => {
    if (err) {
      res.send({
        status: false,
        msg: 'An unexpected error occoured. Please try again later.'
      });
      return;
    }

    console.log(decoded.username)
    console.log(decoded.sessionId);

    User.findOne({
      username: decoded.username,
      sessionId: decoded.sessionId
    }, (err, user) => {
      if (err) {
        callback({
          status: false,
          msg: 'An unexpected error occured. Please try again later.;'
        });
        return;
      }

      if (!user) {
        callback({
          status: false,
          msg: 'Unauthorized access or your session may have expired. Please try again.'
        });
      }
      memcached.set('memname', 'req.cookies.smlCookie', 1800, function(err, memset) { //time is 30 minutes
        if (err)
          res.send({
            status: false,
            msg: 'An non unexpected error occoured . Please try again'
          });
        else {
          console.log('setting');
          callback({
            status: true,
            msg: 'Token successfully verified',

          });
        }
      })

    });


  });
}

var nodemailer = require('nodemailer');

var smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'savaniswapnapriya@gmail.com',
    pass: 'pythonprogramming'
  }
};

var smtpTransport = nodemailer.createTransport(smtpConfig);

var rand, mailOptions, host, link;





mongoose.Promise = global.Promise;


mongoose.connect('mongodb://localhost:27017/mydb');


var db = mongoose.connection;

db.once('open', () => {
  console.log('Successfully connected to db...');
});


User.on('index', (error) => {
  if (error) {
    console.log('Unable to build user index');
    console.log(error);
    //res.send({
    //				status: 404,
    //				msg: 'incorrect email '
    //			});
  }

  console.log('Index build...');

  app.get('/public/:URL', (req, res) => {
    res.sendfile('public/' + req.param('URL'));
  });

  app.get('/', function(req, res) {
    res.sendfile('public/index.html');
  });
  app.get('/index', function(req, res) {
    res.sendfile('public/index.html');
  });

  app.get('/home', function(req, res) {
    res.sendfile('home.html')
  });

  app.get('/login', function(req, res) {
    res.sendfile('public/index.html')
  });

  app.get('/signup', function(req, res) {
    res.sendfile(__dirname + '/signupprofession.html');
  });


  app.all('/secure/user*', (req, res, next) => {
    verifytoken(req, res, (data) => {
      if (!data.status) {
        res.send(data);
        return;
      }
      next();
    });
  });


  app.get('/secure/user/:URL', (req, res, next) => {
    console.log(req.param('URL'));
    res.sendFile(__dirname + '/secure/user/' + req.param('URL'));

  });




  // app.get('/forgetPassword',function(req,res)
  // {
  //    res.sendfile(__dirname + '/forgetPassword.html');
  // })

  // app.post('/forgetPassword',function(req,res){
  // 	var email=req.body.inputEmail4;
  // 	console.log(email);
  // 	//var id= User.findOne({email:"email"});

  // 	//console.log(email.mongoose.Types);//email=mongoose.Types.ObjectId(email);
  // 	User.findOne({ email: email }, function(err, user) {
  // 		    if (err) {
  //  					console.log(err);
  //  					return res.send({
  //  						status:false,
  //  						msg:'An error occoured please try again'
  //  					});
  //  				}
  // 		    if (!user){
  //  					return res.send({
  // 					status: false,
  // 					msg: 'incorrect email '
  // 				});
  //  				}
  //  			})
  //  			 var password=req.body.newpassword;

  //  			bcrypt.hash(password, 10, function (err, hash) {
  // 		    if (err) {
  // 		      return next(err);
  // 		    }
  // 		     password = hash;
  // 		    console.log("hashed pass:"+password);
  // 		    User.findOneAndUpdate({email:email},{password:password},function(err,update){
  //  				// if(!mongoose.Types.ObjectId.isValid(email))
  //  				// 	console.log("invalid");
  //  				if(err)
  // 				res.send({
  // 					status: false,
  // 					msg: JSON.stringify(err)
  // 				});
  // 			else{
  // 				res.send({
  // 					status: true,
  // 					msg: 'password Successfully inserted'
  // 				});
  // 				console.log("test");
  // 			}


  // 		})

  // 		  })


  // 		//User.findByIdAndUpdate({email:email},{password:password},{new:true});



  // })
  app.post('/logout', (req, res) => {
    
    res.clearCookie('smlCookie'); //clear the cookie

    User.findOneAndUpdate({
      username: username,
      sessionId: ''
    })
    res.send('home.html')


  });

  app.post('/login', function(req, res) {
    console.log("hi in login");

    if (!req.body.username || !req.body.pass || !req.body.profession) {
      res.send({
        status: false,
        msg: 'Please enter all the necessay details'
      });
      return;
    }

    username = req.body.username;
    password = req.body.pass;
    profession = req.body.profession;


    User.findOne({
      username: username,
      profession: profession
    }, function(err, user) {
      if (err) {
        res.send({
          status: false,
          msg: 'An error occoured with the db please try again'
        });
        return;
      }


      if (!user) {
        res.send({
          status: false,
          msg: 'Username does not exist.'
        });
        return;
      }



      user.comparePassword(password, (cData) => {
        console.log(cData);

        if (!cData.status) {
          res.send({
            status: false,
            msg: 'An unexpected error occured. Please try again later.'
          });
          return;
        }

        if (cData.isMatch) {
          //Check if session id is ''. If not clean up session
          // and logout the user and inform him.
          //Else create and insert session id into the database

          if (user.sessionId != '') {
            user.sessionId = '';
            User.findOneAndUpdate({
              username: username
            }, {
              $set: {
                sessionId: ''
              }
            }, (saveErr, saveUser) => {
              if (saveErr)
                res.send({
                  status: false,
                  msg: 'An unexprected error occoured.please try again ',
                  path: 'home.html'
                });
              else
                res.send({
                  status: false,
                  msg: 'Previous session was incomplete we have logged you out,please log in again',
                  path: 'home.html'
                });
            });
            return;
          }

          demo = randomstring.generate(8);

          User.findOneAndUpdate({
            username: username
          }, {
            $set: {
              sessionId: demo
            }
          }, {
            new: true
          }, (saveErr, saveDoc) => {
            console.log('here');
            console.log(saveDoc);
            if (saveErr) {
              res.send({
                status: false,
                msg: 'An unexprected error occoured. Please try again ',
                path: 'home.html'
              })
              return;
            }

            var token = jwt.sign({
                username: username,
                sessionId: demo
              },
              jwtKey, {
                expiresIn: "1h",
                algorithm: 'HS256'
              },
              function(err, token) {
                console.log(err);
                if (err) {
                  res.send({
                    status: false,
                    msg: 'An unexpected error occoured. Please try again later.'
                  });
                  return;
                }

                console.log(token);

                res.cookie('smlCookie', token, {
                  maxAge: 3600 * 1000, //1 hr
                });

                if (profession == 'Administrator')
                  res.send({
                    status: true,
                    //token:token,
                    msg: 'Welcome',
                    path: 'secure/admin/admindashboard.html'
                  });
                else
                  res.send({
                    //token:token,
                    status: true,
                    msg: 'Welcome',
                    path: 'secure/user/dashboard.html'
                  });
              });
          });
        } else
          res.send({
            status: false,
            msg: 'Invalid password'
          });
      });
    });

  });








  app.post('/profession', function(req, res) {
    var profession = req.body.prof;

    if (profession == 'Administrator') {
      res.sendfile('public/loginpage.html');
    } else if (profession == 'Faculty/Staff') {
      res.sendfile('public/loginpage.html')
    } else if (profession == 'Student') {
      res.sendfile('public/loginpage.html')
    } else if (profession == 'Cleaner') {
      res.sendfile('public/loginpage.html')
    }


  });



  // app.get('/setuser',(req,res,next)=>{
  // 	res.cookie('userdata',users,{expire:40000+Date.now()});
  // 	console.log('user data added to cookie');
  //}


  // app.get('/getuser',(req,res,next)=>{
  // 	console.log(req.cookies);

  // })





  app.post('/signupprofession', (req, res) => {
    console.log("in sp");
    var profnum = req.body.sprof;

    if (profnum == 'Student')
      res.sendfile('public/signup.html')

    else if (profnum == 'Cleaner')
      res.sendfile('public/signup.html')

    else if (profnum == 'Faculty/Staff')
      res.sendfile('public/signup.html')
  });



  app.post('/signup', (req, res) => {
    console.log('Got signup Request ' + req.body.email);
    User.findOne({
      email: req.body.email
    }, function(err, userRet) {

      // Make sure user doesn't already exist
      if (userRet) {
        res.send({
          status: false,
          msg: 'User already exists'
        });
        return;
      }

      var myData = new User({
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        profession: req.body.profession
      });


      myData.save((error) => {
        if (error) {
          res.send({
            status: false,
            msg: JSON.stringify(error)
          });
          return;
        }


        // res.send({
        // 	status: true,
        // 	msg: 'user Successfully inserted'
        // });
        rand = Math.floor((Math.random() * 100) + 54);
        host = req.get('host');
        link = 'hello,<br> Please Click in the link to verify email.<br><a href=';
        link += 'http://' + req.get('host') + '/verify?id=' + rand;
        link += '>Click here to verify</a>';
        mailOptions = {
          from: 'Sarvani <savaniswapnapriya@gmail.com>',
          to: req.body.email,
          subject: 'Confirm your email',
          html: link
        };

        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, (error, respose) => {

          //console.log(error);
          //console.log(respose);

          if (error) {
            console.log(error);
            res.send({
              status: false,
              msg: 'Unable to send verification email'
            });
            return;
          }

          console.log('message sent');
          res.send({
            status: true,
            msg: 'Please check your email to continue the verification'
          });
        });
      });
    });
  });

  app.get('/verify', function(req, res) {

    console.log(req.protocol + ":/" + req.get('host'));


    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
      console.log("Domain is matched . Information is from authentic email");
      if (req.query.id == rand) {
        console.log("email is verified ");

        res.sendfile('home.html')

      }
    } else {
      console.log("Email not verified");
      res.end("<h1>Bad Request</h1>");

    }
  });



  app.listen('3000', () => {
    console.log("server is working")
  });

});
