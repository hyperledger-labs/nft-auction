/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('helper');
const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const config = require('config');

logger.level = config.logLevel;

const helper = require('../../../fabric-helper/lib/helper');
const invoke = require('../../../fabric-helper/lib/invoke-transaction');
const query = require('../../../fabric-helper/lib/query');

module.exports.getRegisteredUser = async function (username, userOrg) {
    let user = await helper.getRegisteredUser(username, userOrg);
    return user;
};

module.exports.getRegistrarForOrg = async function (userOrg) {
    let registrar = await helper.getRegistrarForOrg(userOrg);
    return registrar;
}

module.exports.getCCP = async function (userOrg) {
    let ccp = await helper.getCCP(userOrg);
    return ccp;
}

module.exports.enrollAdmin = async function (userOrg) {
    let admin = await helper.enrollAdmin(userOrg);
    return admin;
}

module.exports.getAdminCreds = async function (orgName) {
    let adminCreds = await helper.getAdminCreds(orgName);
    return adminCreds;
}

module.exports.registerAndEnrollUser = async function (username, secret, userOrg, isJson) {
    let user = await helper.registerAndEnrollUser(username, secret, userOrg, isJson);
    return user;
}

module.exports.invokeTransaction = function (channelName, chaincodeName, payloadArr, fName, username, userOrg) {
    return invoke.invokeTransaction(channelName, chaincodeName, payloadArr, fName, username, userOrg);
};

module.exports.queryChaincode = function (channelName, chaincodeName, payloadArr, fName, username, userOrg) {
    return query.queryChaincode(channelName, chaincodeName, payloadArr, fName, username, userOrg);
};

module.exports.sendResponse = function (res, resultPromise) {
    if (resultPromise) {
        resultPromise.then((data) => {
            let parsedData = JSON.parse(data);
            if (parsedData.status == 'SUCCESS'){
                let jsonResponse = {};
                jsonResponse.status = 200;
                jsonResponse.message = parsedData.detail;
                res.status(200).send(jsonResponse);
            }
        }, (err) => {
            let parsedErr = JSON.parse(err.message);
            let jsonResponse = {};
                jsonResponse.status = err.status;
                jsonResponse.message = parsedErr.detail;
            res.status(500).send(jsonResponse);
        });
    }
}

module.exports.userSignature = async function (username, msg) {
    let signedData = await helper.userSignature(username, msg);
    return signedData;
}

var sleep = async function (sleep_time_ms) {
    return new Promise(resolve => setTimeout(resolve, sleep_time_ms));
}
