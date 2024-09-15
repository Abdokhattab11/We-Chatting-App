## Table of contents

* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)

## General info

This project is a real-time chat application prototype built with Node.js.
It allows users to create accounts, search for other users,
and initiate private or group chat rooms.

## Features

The project include this features

* Account creation & activation
* Update account details
* Account recovery & forget password
* Search for other users
* Create a chat channel with other users
* Online indicator
* typing indicator
* seen messages indicator
* delivered messages indicator

## Technologies

Project is created with:

* Node.js & Express
* mongoDB & mongoose
* Socket.io
* Redis
* Winston
* JWT authentication
* Cookies
* Bcrypt & Crypto
* Multer & Sharp
* Node Mailer
* Postman for testing

## APIs List

* POST /api/v1/auth/login
* POST /api/v1/auth/signup
* POST /api/v1/auth/logout
* PATCH /api/v1/auth/activateAccount/:activationToken
* OST /api/v1/auth/resendActivationCode/:activationToken
* POST /api/v1/auth/forgetpassword
* PATCH /api/v1/auth/passwordResetVerification/:passwordResetVerificationToken
* PATCH /api/v1/auth/resetPassword/:resetToken
* GET /api/v1/user
* PUT /api/v1/user
* DLE /api/v1/user
* GET /api/v1/user/search?name=userName
* GET /api/v1/chat
* GET api/v1/chat/:chatId

## Sockets Events

* connect_user
* connect_user_error
* join_create_room
* room_created
* update_online_users
* is_receiver_connected_to_room
* message
* message_delivered
* message_delivered_error
* message_seen
* message_seen_error
* im_typing
* typing
* disconnect

## Setup

To run this project, install it locally using npm:

```
$ cd ../lorem
$ npm install
$ npm start
```