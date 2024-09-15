const winston = require('winston');

winston.loggers.add('logger', {
    level: 'info',
    transports: [
        new winston.transports.Console(),
    ],
    format: winston.format.cli()
})