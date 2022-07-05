/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const path = require('path');
const helper = require('./helper.js');
const logger = helper.getLogger('query-chaincode');
const config = require('../../network/general-config.json');
const { Gateway } = require('fabric-network');
const walletHelper = require('./wallet');

var queryChaincode = async function (channelName, chaincodeName, args,
	functionName, userName, orgName, networkConfigFilePath) {
	logger.info('========= Query chaincode on org: "%s", channelName: "%s",' +
		'chaincodeName: "%s", userName: "%s", functionName: "%s", args: "%s" ========= '
		, orgName, channelName, chaincodeName, userName, functionName, args);

	// Check to see if we've already enrolled the user.
	let wallet = await walletHelper.getWallet();
	let userIdentity = await wallet.get(userName);
	if (!userIdentity) {
		throw new Error(`An identity for the user ${userName} does not exist in the wallet`);
	}

	// Load connection profile; will be used to locate a gateway
	let connectionProfile = await helper.getCCP(orgName);

	// Set connection options; identity and wallet
	let connectionOptions = {
		identity: userName,
		wallet: wallet,
		discovery: { enabled: true, asLocalhost: false }
	};

	const gateway = new Gateway();

	try {
		// Connect to gateway using application specified parameters
		logger.debug('Connect to Fabric gateway.');
		await gateway.connect(connectionProfile, connectionOptions);
		// Access network
		logger.debug(`Use network channel: ${channelName}`);
		const network = await gateway.getNetwork(channelName);
		//Get addressability to rta contract
		const contract = network.getContract(chaincodeName);

		const results = await contract.evaluateTransaction(functionName, ...args);
		if (results) {
			console.log(`Transaction has been evaluated, result is: ${results.toString()}`);
			return JSON.parse(results.toString());
		} else {
			logger.error('results is null');
			return 'results is null';
		}
	} catch (err) {
		if (err.message.includes('DiscoveryService has failed to return results') ||
			err.message.includes('REQUEST TIMEOUT') ||
			err.message.includes('UNAVAILABLE')
		) {
			throw new Error("Peers are busy/unreachable. Try again later");
		}
		throw new Error(JSON.parse(err.message).detail);
	}
	finally {
		// Disconnect from the gateway when the application is closing
		// This will close all connections to the network
		gateway.disconnect();
	}
};

exports.queryChaincode = queryChaincode;
