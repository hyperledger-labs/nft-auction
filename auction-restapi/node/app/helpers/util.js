
/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const appUtil = {}; //controller object
const express = require('express');
const router = express.Router();
const log4js = require('log4js');
const logger = log4js.getLogger('helper');
const config = require('config');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multiHashing = require('multihashing-async');
logger.level = config.logLevel;

appUtil.isPathUnprotected = function (text, searchWords) {
  // create a regular expression from searchwords using join and |. Add "gi".
  // Example: ["ANY", "UNATTENDED","HELLO"] becomes
  // "ANY|UNATTENDED|HELLO","gi"
  // | means OR. gi means GLOBALLY and CASEINSENSITIVE
  let searchExp = new RegExp(searchWords.join("|"), "gi");
  // regularExpression.test(string) returns true or false
  return (searchExp.test(text)) ? true : false;
}

appUtil.encrypt = function (text, masterkey) {
  // random initialization vector
  const iv = crypto.randomBytes(16);

  // random salt
  const salt = crypto.randomBytes(64);

  // derive key: 32 byte key length - in assumption the masterkey is a cryptographic and NOT a password there is no need for
  // a large number of iterations. It may can replaced by HKDF
  const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

  // AES 256 GCM Mode
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // encrypt the given text
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  // extract the auth tag
  const tag = cipher.getAuthTag();

  // generate output
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
},

  /**
  * Decrypts text by given key
  * @param String base64 encoded input data
  * @param Buffer masterkey
  * @returns String decrypted (original) text
  */
  appUtil.decrypt = function (data, masterkey) {
    // base64 decoding
    const bData = Buffer.from(data, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text = bData.slice(96);

    // derive key using; 32 byte key length
    const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

    return decrypted;
  }

/**
* Produces hash of plain text 
* Uses password-hashing with salt to protect against rainbow table attacks
* @param String password in plain text
* @returns String hashed value of the password
*/
appUtil.hashPassword = function (pwdStr) {
  // salt rounds can be increased to make it slower, 
  // so it remains resistant to brute-force search attacks even with increasing computation power. 
  // TODO - make the salt round configurable
  let saltRounds = 10;

  // Blowfish encryption algorithm uses 128-bit salt and encrypts a 192-bit magic value
  const hashedPassword = bcrypt.hashSync(pwdStr, saltRounds);
  return hashedPassword;
}

/**
* Validates password against the hashed value
* @param String password in plain text
* @param String hashed value of password
* @returns Boolean whether the password matches the hash
*/
appUtil.isPasswordValid = function (pwdStr, pwdHash) {
  return bcrypt.compareSync(pwdStr, pwdHash);
}

/**
   * @param {string} data to which hash needs to be calculated
   * @returns {string} hex decimal value of string
  */
appUtil.calculateHash = async (data) => {
  logger.debug('Data about to hash', JSON.stringify(data));
  const buf = new Buffer.from(data);
  const algorithm = config.get("hashingAlgorithm");
  const multiHashValue = await multiHashing(buf, algorithm);
  return multiHashValue.toString('hex');
},
  /**
  * @param {string} data actual data to be verified
  * @param {hashOfData} encodedHash encoded hash of data
  * @returns {boolean}  data matches with hash
  */
  appUtil.verifyHash = async (data, hashOfData) => {
    const buffer = new Buffer.from(data);
    const hashBuffer = Buffer.from(hashOfData, 'hex');
    const result = await multiHashing.validate(buffer, hashBuffer);
    return result;

  }

/**
 * Produces a random integer between two values, inclusive
 * @param {number} min minimum value
 * @param {number} max maximum value
 * @returns {number} random integer
 */
appUtil.getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

//mandatary to export
module.exports = appUtil;
