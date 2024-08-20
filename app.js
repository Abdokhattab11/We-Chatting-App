const express = require('express')
const app = express()


app.use(express.json());
app.use(require('middlewares/tokenCheckInRedisMiddleware'));

app.all('*',require('./middlewares/globalErrorHandler'));

module.exports = app