const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET, MAILGUN_API, MAILGUN_DOMAIN, EMAIL } = require ('../config/keys')
const requireLogin = require('../middleware/requireLogin')
var Mailgun = require('mailgun-js')

var api_key = MAILGUN_API;
var domain = MAILGUN_DOMAIN;
var from_who = 'no-replay@insta-clone.com';
var mailgun = new Mailgun({apiKey: api_key, domain: domain});

router.post('/signup', (req, res) => {
  const {name, email, password, pic} = req.body;
  if (!email || !password || !name) {
    return res.status(422).json({
      error: "please add all the field"
    })
  }
  User.findOne({
    email: email
  })
  .then((savedUser) => {
    if (savedUser) {
      return res.status(422).json({
        error: "user already exists with that email"
      })
    }
    bcrypt.hash(password, 12)
    .then(hashedpassword => {
      const user = new User({
        email,
        password:hashedpassword,
        name,
        pic
      })
      user.save()
      .then(user => {
        mailgun.messages().send({
          from: from_who,
          to: user.email,
          subject: 'Signup Success',
          html: 'Welcome to Insta-Clone by Peps'
        }, function (err, body) {
          if (err) {
            console.log(err)
          }
        });
        res.json({
          message: "saved successfully"
        })
      })
      .catch(err => {
        console.log(err)
      })
    })
  })
  .catch(err => {
    console.log(err)
  })
})

router.post('/signin', (req, res) => {
  const {email, password} = req.body
  if (!email || !password) {
    return res.status(422).send({
      error: "please add email or password"
    })
  }
  User.findOne({
    email: email
  })
  .then(savedUser => {
    if(!savedUser) {
      return res.status(422).send({
        error: "invalid email or password"
      })
    }
    bcrypt.compare(password, savedUser.password)
    .then(doMatch => {
      if(doMatch) {
        // res.json({
        //   message: "successfully signed in"
        // })
        // JSON Web Token
        const token = jwt.sign({
          _id: savedUser._id
        }, JWT_SECRET)
        const {_id, name, email, followers, following, pic} = savedUser
        res.json({
          token,
          user:{
            _id,
            name,
            email,
            followers,
            following,
            pic
          }
        })
      } else {
        return res.status(422).send({
          error: "invalid email or password"
        })
      }
    })
    .catch(err => {
      console.log(err);
    })
  })
})

router.post('/reset-password', (req, res) => {
  console.log(req.body.email)
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
    }
    const token = buffer.toString("hex")
    User.findOne({email: req.body.email})
    .then(user => {
      if(!user) {
        return res.status(422).json({
          error: "user doesn't exist with that email"
        })
      }
      user.resetToken = token
      user.expireToken = Date.now() + 3600000
      user.save()
      .then((result) => {
        mailgun.messages().send({
          from: from_who,
          to: user.email,
          subject: 'Password Reset',
          html: `
          <p>You requested for password reset</p>
          <h5>click this <a href="${EMAIL}/reset/${token}">link</a> to reset password</h5>
          `
        }, function (err, body) {
          if (err) {
            console.log(err)
          }
        })
        res.json({
          message: "check your email"
        })
      })
    })
  })
})

router.post('/new-password', (req, res) => {
  const newPassword = req.body.password
  const token = req.body.token
  User.findOne({resetToken: token, expireToken:{$gt: Date.now()}})
  .then(user => {
    if (!user) {
      return res.status(422).json({
        error: "try again session expired"
      })
    }
    bcrypt.hash(newPassword, 12)
    .then(hashedPassword => {
      user.password = hashedPassword
      user.resetToken = undefined
      user.expireToken = undefined
      user.save()
      .then((savedUser) => {
        res.json({
          message: "password update success"
        })
      })
    })
  })
  .catch(err => {
    console.log(err)
  })
})

module.exports = router