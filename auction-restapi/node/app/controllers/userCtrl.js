/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const userCtrl = {}; //controller object
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const helper = require('../helpers/fabric-helper');
const config = require('config');
const {errorResponse} = require('../object-builders/client-response-builder');
const UserService = require('../services/user.service');

const log4js = require('log4js');
const logger = log4js.getLogger('userCtrl');
logger.level = config.logLevel;


router.use(bodyParser.urlencoded({ extended: true }));

userCtrl.login = async function (req, res, next) {
    logger.debug(">>> inside userCtrl.login() ...")
    try {
        const username = req.body.username;
        const password = req.body.password;
        const orgName = req.body.org;

        // check if the user is enrolled in the fabric-ca
        await helper.getRegisteredUser(username, orgName);

        let userService = new UserService();
        let userResponse = await userService.authenticateUser(username,password,orgName);

        return res.status(200).send(userResponse);
    } catch (error) {
        logger.error(error);
		return res.status(401).send(errorResponse.format(error.message));
    }
}

userCtrl.register = async function (req, res) {
    logger.debug(">>> inside userCtrl.register() ...")
    logger.debug(">>> userCtrl.register() : req.body: %s", req.body);
    let username, password;
    try {
        username = req.body.userID;
        password = req.body.password;

        let user = await helper.registerAndEnrollUser(username, password, config.auctionHouseOrgName, true);
        if (!user) {
            let errMsg = `A user already exists with the username ${username}`;
            return res.status(409).send(errorResponse.format(errMsg));
        }

        let userService = new UserService();
        await userService.register(req.body);

        return res.status(200).send(user);
    } catch (error) {
        logger.error(error);
		return res.status(401).send(errorResponse.format(error.message));
    }
}

//mandatary to export
module.exports = userCtrl;