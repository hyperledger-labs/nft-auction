/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const path = require('path');
const fs = require('fs-extra');
const FabricCAServices = require('fabric-ca-client');
// const FabricCAServices = require('fabric-common');
const log4js = require('log4js');
const logger = log4js.getLogger('fabric-helper');
const config = require('../../network/general-config.json');
const walletHelper = require('./wallet');

//Setting default environment type if not mentioned to local
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = 'local'
}

logger.level = config.loglevel;


module.exports.getRegistrarForOrg = async function (userOrg) {
	// load the common connection configuration file
	const cpPath = path.resolve(__dirname, '../../network/' + process.env.NODE_ENV + '/network-config/' + userOrg + '.json');
	const fileExists = fs.existsSync(cpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${cpPath}`);
	}
	const contents = fs.readFileSync(cpPath, 'utf8');

	// build a JSON object from the file contents
	const cp = JSON.parse(contents);

	return cp.client.registrar[0];
}

module.exports.getRegisteredUser = async function (username, userOrg) {
	try {
		const wallet = await walletHelper.getWallet();
		const userIdentity = await wallet.get(username);
		if (!userIdentity) {
			logger.error(`An identity for the user ${username} does not exists in the wallet`);
			throw "User does not exist";
		}

		// build a user object
		let provider = wallet.getProviderRegistry().getProvider(userIdentity.type);
		const user = await provider.getUserContext(userIdentity, username);

		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded "%s" of org "%s" from persistence', username, userOrg);
			return user;
		}
		else {
			throw "username or password incorrect";
		}
	} catch (err) {
		logger.error(`Failed to get Registered User: ${err}`);
		throw new Error(err.toString());
	}
};

module.exports.getLogger = function (moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.level = config.loglevel;
	return logger;
};

module.exports.getCCP = (org) => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '../../network/' + process.env.NODE_ENV + '/network-config/network-config-' + org + '.json');
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	logger.debug(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

module.exports.enrollAdmin = async (orgName) => {
	try {
		const ccp = this.getCCP(orgName);
		const clientOrg = ccp.client.organization;

		const org = ccp.organizations[clientOrg];
		const mspId = org.mspid;

		const caClient = await this.getCAClientByOrg(orgName);

		// path to store identities within the file system. For now we will not use it.
		let walletPath = path.join(__dirname,`../../network/${process.env.NODE_ENV}/identities/wallet`);
		// create new wallet instance
		await walletHelper.create(walletPath);
		const wallet = await walletHelper.getWallet();

		let { adminUserId, adminUserPasswd } = await this.getAdminCreds(orgName);
		// Check to see if we've already enrolled the admin user.
		const identity = await wallet.get(adminUserId);
		if (identity) {
			logger.info('An identity for the admin user already exists in the wallet');
			return;
		}

		// Enroll the admin user, and import the new identity into the wallet.
		const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: mspId,
			type: 'X.509',
		};
		await wallet.put(adminUserId, x509Identity);
		logger.info('Successfully enrolled admin user and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to enroll admin user : ${error}`);
		throw new Error('Failed to enroll admin user: ' + err.toString());
	}
};

module.exports.registerAndEnrollUser = async (username, secret, userOrg, isJson) => {
	try {
		const ccp = this.getCCP(userOrg);
		const clientOrg = ccp.client.organization;

		const org = ccp.organizations[clientOrg];
		const orgMspId = org.mspid;

		let { adminUserId } = await this.getAdminCreds(userOrg);

		const caClient = await this.getCAClientByOrg(userOrg);
		// Check to see if we've already enrolled the user
		const wallet = await walletHelper.getWallet();
		const userIdentity = await wallet.get(username);
		if (userIdentity) {
			logger.info(`An identity for the user ${username} already exists in the wallet`);
			return;
		}

		// Must use an admin to register a new user
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			logger.info('An identity for the admin user does not exist in the wallet');
			logger.info('Enroll the admin user before retrying');
			return;
		}

		// build a user object for authenticating with the CA
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

		// Register the user, enroll the user, and import the new identity into the wallet.
		// if affiliation is specified by client, the affiliation value must be configured in CA
		let affiliation = userOrg.toLowerCase() + '.department1';

		await caClient.register({
			// affiliation: affiliation,
			enrollmentID: username,
			enrollmentSecret: secret,
			role: 'client'
		}, adminUser);

		const enrollment = await caClient.enroll({
			enrollmentID: username,
			enrollmentSecret: secret
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(username, x509Identity);
		logger.info(`Successfully registered and enrolled user ${username} and imported it into the wallet`);
		if (isJson && isJson === true) {
			var response = {
				success: true,
				username: username
			};
			return response;
		}
	} catch (error) {
		logger.error(`Failed to register user : ${error}`);
		if(error.message.includes('Calling register endpoint failed')){
			throw new Error("Fabric CA is busy/unreachable. Try again later");
		}
		throw new Error(`Failed to register user : ${error}`);
	}
};

module.exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}

module.exports.getCAClientByOrg = async(orgName) => {
	const ccp = this.getCCP(orgName);
	const clientOrg = ccp.client.organization;
	logger.debug("Client Org -> ", clientOrg);
	const org = ccp.organizations[clientOrg];
	logger.debug("Org -> ", org);
	const orgCAKey = org.certificateAuthorities[0];
	logger.debug("Org CA Key -> ", orgCAKey);
	const caURL = ccp.certificateAuthorities[orgCAKey].url;
	logger.debug("Org CA URL -> ", caURL);
	const caName = ccp.certificateAuthorities[orgCAKey].caName;
	logger.debug("Org CA Name -> ", caName);
	const caTLSCACerts = ccp.certificateAuthorities[orgCAKey].tlsCACerts.pem;
	const mspId = org.mspid;
	logger.debug("MSP Id -> ", mspId);

	// enroll user with certificate authority for orgName
	const tlsOptions = {
		trustedRoots: caTLSCACerts,
		verify: false,
	};
	const caClient = new FabricCAServices(caURL, tlsOptions, caName);
	return caClient;
}
module.exports.getAdminCreds = async(orgName) => {
	let admin = config.adminList.filter((admin) => admin.org == orgName)[0];
	let adminUserId = admin.username;
	let adminUserPasswd = admin.password;
	return { adminUserId, adminUserPasswd };
}

module.exports.userSignature = async function (username, msg) {
	try {
		const wallet = await walletHelper.getWallet();
		const userIdentity = await wallet.get(username);
		if (!userIdentity) {
			throw new Error(`An identity for the user ${username} does not exists in the wallet`);
		}

		// build a user object
		let provider = wallet.getProviderRegistry().getProvider(userIdentity.type);
		const user = await provider.getUserContext(userIdentity, username);

		if (user && user.isEnrolled()) {
			// get the signing identity of the user
			let csr = user.getSigningIdentity();
			let signedData = await csr.sign(msg);
			return signedData;
		}
		else {
			throw new Error('user is not enrolled');
		}
	} catch (err) {
		logger.error('Failed to sign data with user signature: ' + err.stack ? err.stack : err);
		throw new Error('Failed to sign data with user signature: ' + err.toString());
	}
};

