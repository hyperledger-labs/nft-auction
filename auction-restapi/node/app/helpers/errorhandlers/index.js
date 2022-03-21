const {errorResponse} = require('../../object-builders/client-response-builder');
const config = require('config');
const log4js = require('log4js');
const logger = log4js.getLogger('errorhandler');
logger.level = config.logLevel;

function replaceErrors(key, value) {
    if (value instanceof Error) {
        var error = {};

        Object.getOwnPropertyNames(value).forEach(function (key) {
            error[key] = value[key];
        });

        return error;
    }

    return value;
}
module.exports = {

    clientErrorHandler: (err, req, res,next)=> {
        if(err.status){
            if(!err.detail && err.message){
                err.detail = err.message;
            }
            logger.error(`${JSON.stringify(err)}`);
            let response = errorResponse.format(err.detail);
            if (typeof err.status === "number") {
                return res.status(err.statusCode).send(response);
            } else {
                return res.status(err.status).send(response);
            }
        }
        return next(err);
    },
    // caution: do not remove "next" even if it looks used
    // eslint-disable-next-line no-unused-vars
    errorHandler: (err, req, res,next)=> {
        logger.error(`${JSON.stringify(err, replaceErrors)}`);
        let errMsg = 'An error occurred while processing the request';
        let response = errorResponse.format(errMsg);
        return res.status(500).send(response);
    }
};
