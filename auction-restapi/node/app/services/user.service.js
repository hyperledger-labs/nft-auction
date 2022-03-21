const config = require('config');
const helper = require('../helpers/fabric-helper');
const dateUtil = require('../helpers/date-helper');
const lodash = require('lodash');
const appUtil = require('../helpers/util');
const { isPasswordValid } = require('../helpers/util');
const { parseOnchainData } = require('../helpers/onchainDataParser');
const { userLoginResponse } = require('../object-builders/responseBuilder');
const jwt = require('jsonwebtoken');

const log4js = require('log4js');
const logger = log4js.getLogger('userService');
logger.level = config.logLevel;


/**
 * #generateTokenForUser - To generate jwt token for the authenticated user
 * @returns string - jwt token
 */
function generateTokenForUser(username, orgName) {
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(config.jwt_expiretime),
        username: username,
        orgname: orgName
    }, config.secret);
}

/**
 * getCurrentPasswordHash - To get the current password hash of the user
 * @returns string - password hash of the user
 */
function getCurrentPasswordHash(onchainUserObject) {
    return lodash.get(onchainUserObject, 'password');
}

/**
 * #getUserType - To get the user type
 * @returns string - user type. possible values are AH(Auction House), TRD(Trader)
 */
function getUserType(onchainUserObject) {
    return lodash.get(onchainUserObject, 'userType');
}

function buildLoginResponse(username, orgName, onchainUserObject) {
    const token = generateTokenForUser(username, orgName);
    const userType = getUserType(onchainUserObject);
    return userLoginResponse(token, username, userType);
}

async function validatePassword(password, currentPasswordHash) {
    if (!(isPasswordValid(password, currentPasswordHash))) {
        throw new Error("Invalid password");
    }
}

/**
 * #getUserByUsername - To get user object from onchain 
 * @returns object - user object
 */
async function getUserByUsername(username, orgName) {
    let payloadForOnchain = [];
    payloadForOnchain.push(username);

    let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetUserDetails", username, orgName);
    return parseOnchainData(onchainResponse);
}

class UserService {

    /**
     * authenticateUser - To authenticate a user
     * @param {*} username - username of the user
     * @param {*} password - Password of the user
     * @param {*} orgName - organization to which the user belongs
     */
    async authenticateUser(username, password, orgName) {
        try {
            let onchainUserObject = await getUserByUsername(username, orgName);
            let currentPasswordHash = getCurrentPasswordHash(onchainUserObject);
            await validatePassword(password, currentPasswordHash);
            return buildLoginResponse(username, orgName, onchainUserObject);
        } catch (error) {
            throw error;
        }
    }

    /**
     * register - To authenticate a user
     * @param {*} username - username of the user
     * @param {*} password - Password of the user
     * @param {*} orgName - organization to which the user belongs
     */
    async register(payload) {
        try {
            let username = payload.userID;
            let password = payload.password;

            payload.password = appUtil.hashPassword(password);  // set the password hash before saving to onchain
            payload.timeStamp = dateUtil.getTimestamp();    // set current time

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(payload));

            logger.debug(">>> userCtrl.register() : args: %s", payloadForOnchain);
            await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "CreateUser", username, config.auctionHouseOrgName);
            return;
        } catch (error) {
            throw error;
        }

    }
}

module.exports = UserService;