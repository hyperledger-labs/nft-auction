/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const path = require('path');
const fs = require('fs');
const util = require('util');
const helper = require('./helper.js');
const config = require('../../network/general-config.json');
const logger = helper.getLogger('invoke-chaincode');
const { Gateway } = require('fabric-network');
const walletHelper = require('./wallet');

var invokeTransaction = async function (channelName, chaincodeName, args,
	functionName, userName, orgName, networkConfigFilePath) {

	logger.info('========= Invoke chaincode transaction on org: "%s", channelName: "%s",' +
		'chaincodeName: "%s", userName: "%s", functionName: "%s", args: "%s" ========= '
		, orgName, channelName, chaincodeName, userName, functionName, args);


	// Check to see if we've already enrolled the user.
	let wallet = await walletHelper.getWallet();
	// let userIdentity = await wallet.get(userName);
	// if (!userIdentity) {
	// 	let err = `An identity for the user ${userName} does not exist in the wallet`
	// 	logger.error(err);
	// 	throw new Error(err);
	// }

	// Load connection profile; will be used to locate a gateway
	let connectionProfile = await helper.getCCP(orgName);

	// Set connection options; identity and wallet
	let connectionOptions = {
		identity: "admin",
		wallet: wallet,
		discovery: { enabled: true, asLocalhost: true }
	};
	const gateway = new Gateway();
	try {
		// Connect to gateway using application specified parameters
		logger.debug('Connect to Fabric gateway.');
		await gateway.connect(connectionProfile, connectionOptions);
		// Access network
		logger.debug('Use network channel: defaultchannel.');
		const network = await gateway.getNetwork(channelName);
		const contract = network.getContract(chaincodeName);
		// invoke transaction
		const invokeResponse = await contract.submitTransaction(functionName, ...args);
		logger.info("Transaction successfully submitted at " + new Date().toISOString());
		return JSON.parse(invokeResponse.toString());
	} catch (err) {
		logger.error('Error in submitting transaction' + err);
		if (err.message.includes('DiscoveryService has failed to return results') ||
			err.message.includes('REQUEST TIMEOUT') ||
			err.message.includes('UNAVAILABLE')
		) {
			throw new Error("Peers are busy/unreachable. Try again later");
		}
		throw new Error(JSON.parse(err.responses[0].response.message).detail);
	} finally {
		// Disconnect from the gateway
		logger.debug('Disconnect from Fabric gateway.');
		gateway.disconnect();
	}
};

exports.invokeTransaction = invokeTransaction;