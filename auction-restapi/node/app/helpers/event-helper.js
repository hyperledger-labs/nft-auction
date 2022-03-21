/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';

const eventHelper = {};
const log4js = require('log4js');
const logger = log4js.getLogger('event-helper');
const helper = require('./fabric-helper');
const nftController = require("../controllers/nftCtrl");
const config = require('config');
const moment = require('moment');
const { Gateway } = require('fabric-network');
const walletHelper = require('../../../fabric-helper/lib/wallet');
logger.level = config.logLevel;

// function to display transaction data
function showTransactionData(transactionData) {
	const creator = transactionData.actions[0].header.creator;
	logger.debug(`    - submitted by: ${creator.mspid}`);
	for (const endorsement of transactionData.actions[0].payload.action.endorsements) {
		logger.debug(`    - endorsed by: ${endorsement.endorser.mspid}`);
	}
	const chaincode = transactionData.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec;
	logger.debug(`    - chaincode:${chaincode.chaincode_id.name}`);
	logger.debug(`    - function:${chaincode.input.args[0].toString()}`);
	for (let x = 1; x < chaincode.input.args.length; x++) {
		logger.debug(`    - arg:${chaincode.input.args[x].toString()}`);
	}
}

eventHelper.registerEvent = async function (sendAll) {

    // user admin user for listening to chaincode and block events
    let { adminUserId } = await helper.getAdminCreds(config.auctionHouseOrgName);

	let wallet = await walletHelper.getWallet();
	let adminIdentity = await wallet.get(adminUserId);
	if (!adminIdentity) {
		logger.debug(`An identity for the user ${adminUserId} does not exist in the wallet`);
		return;
	}

    // Load connection profile; will be used to locate a gateway
	let connectionProfile = await helper.getCCP(config.auctionHouseOrgName);

	// Set connection options; identity and wallet
	let connectionOptions = {
		identity: adminUserId,
		wallet: wallet,
		discovery: { enabled: true, asLocalhost: true }
	};

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    try {
		logger.debug('Connect to Fabric gateway.');
		await gateway.connect(connectionProfile, connectionOptions);
	} catch (err) {
		logger.error('Failed to establish gateway' + err);
	}
    const network = await gateway.getNetwork(config.channelName);
    const contract = network.getContract(config.chaincodeName);

    logger.debug("**** CHAINCODE EVENTS ****");

    //  - - - - - -  C H A I N C O D E   E V E N T S   L I S T E N E R - - - - - - - //

    try {
        let listener;

        listener = async (event) => {
            if (event.eventName == 'TRANSFER_ITEM'){
                const asset = JSON.parse(event.payload.toString());
                logger.debug(`<-- Contract Event Received: ${event.eventName} - ${JSON.stringify(asset)}`);
                logger.debug(`*** Event: ${event.eventName}`);
                const eventTransaction = event.getTransactionEvent();
                logger.debug(`*** transaction: ${eventTransaction.transactionId} status:${eventTransaction.status}`);
                showTransactionData(eventTransaction.transactionData);
                const eventBlock = eventTransaction.getBlockEvent();
                logger.debug(`*** block: ${eventBlock.blockNumber.toString()}`);

                // transfer the asset
                nftController.transferNftEvent(asset, adminUserId, config.auctionHouseOrgName);
            }
        };
        // start the client side event service and register the listener
        logger.debug(`--> Start contract event stream to peer in ${config.auctionHouseOrgName}`);
        await contract.addContractListener(listener);
    } catch (eventError) {
        logger.debug(`<-- Failed: Setup contract events - ${eventError}`);
    }

    //  - - - - - -  B L O C K  E V E N T S  L I S T E N E R - - - - - - - - - -//

    try {
        let listener;
        // create a block listener
        listener = async (event) => {
            let response = {
                block_id: event.blockNumber.toString(),
                txs: []
            };
            let tx = '';
            logger.debug(`<-- Block Event Received - block number: ${event.blockNumber.toString()}`);
            const transEvents = event.getTransactionEvents();
            for (const transEvent of transEvents) {
                logger.debug(`*** transaction event: ${transEvent.transactionId}`);
                if (transEvent.transactionData) {
                    showTransactionData(transEvent.transactionData);
                    for (let i in event.blockData.data.data){
                        try {
                            tx = {
                                tx_id: event.blockData.data.data[i].payload.header.channel_header.tx_id,
                                timestamp: moment(Date.parse(event.blockData.data.data[i].payload.header.channel_header.timestamp)).format(config.dateFormat),
                                creator_msp_id: event.blockData.data.data[i].payload.header.signature_header.creator.mspid,
                            };
                        }
                        catch (e) {
                            logger.warn('error in removing buffers - this does not matter', e);
                        }
                        //-- parse for parameters -- //
                        response.txs.push(tx);
                    }
                }
            }
            logger.info(response);
            sendAll(response);
        };
        // now start the client side event service and register the listener
        logger.debug(`--> Start private data block event stream`);
        await network.addBlockListener(listener, {type: 'full'});
    } catch (eventError) {
        logger.debug(`<-- Failed: Setup block events - ${eventError}`);
    }
}

module.exports = eventHelper;