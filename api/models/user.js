var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    required: true,
    trim: true
  },
  profession: {
    type: String,

    required: true,

  },
  sessionId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
}); // 'runSettersOnQuery' is used to implement the specifications in our model schema such as the 'trim' option.






//hashing a password before saving it to the database
UserSchema.pre('save', function(next) {
  var user = this;

  var currentDate = new Date().getTime();
  this.updatedAt = currentDate;
  if (!this.created_at) {
    this.createdAt = currentDate;
  }
  var user = this;
  console.log('I am here');
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    console.log(hash);
    next();
  })
});

// const tokenSchema = new mongoose.Schema({
//     _userId: {
//       type: mongoose.Schema.Types.ObjectId,
//        required: true,
//        ref: 'User' },
//     token: { type: String, required: true },
//     createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
// });

//authenticate input against database
UserSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) {
      callback({
        status: false
      });
    } else {
      callback({
        status: true,
        isMatch: isMatch
      });
    }
  });
};


// module.exports = mongoose.model('user', tokenSchema);
module.exports = mongoose.model('user', UserSchema);
