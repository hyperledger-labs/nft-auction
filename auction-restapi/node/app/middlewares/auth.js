/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const log4js = require('log4js');
const jwt = require('jsonwebtoken');
const config = require('config');
const logger = log4js.getLogger('middleware-auth');
const appUtil = require('../helpers/util');
const util = require('util');

logger.level = config.logLevel;

var authenticate = function (req, res, next) {
    logger.debug(util.format('Request url : - %s ', req.originalUrl));
    let routes = ['user/login', 'user/register', 'api-docs', 'api-spec']
    if (appUtil.isPathUnprotected(req.originalUrl, routes)) {
        logger.debug("indexOf unprotected routes was found !!! ");
        return next();
    }
    // check header or url parameters or post parameters for token
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    // if token is there... then adding decoded values from jwt token to the request body
    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else { // if there is no token ...  return an error
        return res.status(401).send({ //instead of 403 ...
            success: false,
            message: 'No token provided.'
        });
    }
}

module.exports.authenticate = authenticate;
