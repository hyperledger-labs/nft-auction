const config = require('config');
const helper = require('../helpers/fabric-helper');
const util = require('../helpers/util');
const mime = require('mime-types');
const crypto = require('crypto');
const path = require('path');
const { parseOnchainData } = require('../helpers/onchainDataParser');
const objectBuilder = require('../object-builders');
const images = require("images");

const log4js = require('log4js');
const constants = require('../constants');
const logger = log4js.getLogger('auctionService');
logger.level = config.logLevel;

class Auction {

    async initAuction(payload, callerInfo) {
        try {
            let auctionObj = objectBuilder.auctionOnchainStruct(payload, callerInfo.username);

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(auctionObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "InitAuction", callerInfo.username, callerInfo.orgname);
            let onchainAuction = parseOnchainData(onchainResponse);
            if (onchainAuction) {
                onchainAuction.itemImage = util.decrypt(onchainAuction.itemImage, onchainAuction.aesKey);
                return onchainAuction;
            };
        } catch (error) {
            throw error;
        }
    }

    async openAuction(payload, callerInfo) {
        try {
            let openAuctionObj = objectBuilder.openAuctionOnchainStruct(payload, callerInfo.username);
            
            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(openAuctionObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "OpenAuction", callerInfo.username, callerInfo.orgname);
            let jsonResponse = {
                status: constants.onchainStatus.success,
                message: onchainResponse.detail
            };
            return jsonResponse;
        } catch (error) {
            throw error;
        }
    }

    async closeOpenAuction(payload, callerInfo) {
        try {
            let auctionObj = {};
            auctionObj.auctionID = payload.auctionID;

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(auctionObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "CloseAuction", callerInfo.username, callerInfo.orgname);
            let jsonResponse = {
                status: constants.onchainStatus.success,
                message: onchainResponse.detail
            };
            return jsonResponse;
        } catch (error) {
            throw error;
        }
    }

    async getInitAuctions(callerInfo) {
        try {
            let payloadForOnchain = [];

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetInitAuctionRequests", callerInfo.username, callerInfo.orgname);
            let onchainInitAuctions = parseOnchainData(onchainResponse);
            if(onchainInitAuctions){
                // do not expose image and AES key
                for (var i = 0, len = onchainInitAuctions.length; i < len; i++) {
                    delete onchainInitAuctions[i].itemImage;
                    delete onchainInitAuctions[i].aesKey;
                }
                return onchainInitAuctions;
            } else {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }

    async getInitAuctionsByAuctionHouseID(callerInfo) {
        try {
            let payloadForOnchain = [];
            payloadForOnchain.push(callerInfo.username);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetInitAuctionRequestsByAuctionHouse", callerInfo.username, callerInfo.orgname);
            let onchainInitAuctions = parseOnchainData(onchainResponse);
            if(onchainInitAuctions){
                // do not expose image and AES key
                for (var i = 0, len = onchainInitAuctions.length; i < len; i++) {
                    delete onchainInitAuctions[i].itemImage;
                    delete onchainInitAuctions[i].aesKey;
                }
                return onchainInitAuctions;
            } else {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }

    async getOpenAuctions(callerInfo) {
        try {
            let payloadForOnchain = [];

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetOpenAuctionRequests", callerInfo.username, callerInfo.orgname);
            let onchainOpenAuctions = parseOnchainData(onchainResponse);
            if(onchainOpenAuctions){
                // do not expose image and AES key
                for (var i = onchainOpenAuctions.length - 1; i >= 0; i--) {
                    if (onchainOpenAuctions[i].sellerID == callerInfo.username) {
                        onchainOpenAuctions.splice(i, 1);
                    } else {
                        delete onchainOpenAuctions[i].itemImage;
                        delete onchainOpenAuctions[i].aesKey;
                    }
                }
                return onchainOpenAuctions;
            } else {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }

    async getOpenAuctionsByAuctionHouseID(callerInfo) {
        try {
            let payloadForOnchain = [];
            payloadForOnchain.push(callerInfo.username);
            
            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetOpenAuctionRequestsByAuctionHouse", callerInfo.username, callerInfo.orgname);
            let onchainOpenAuctions = parseOnchainData(onchainResponse);
            if(onchainOpenAuctions){
                // do not expose image and AES key
                for (var i = onchainOpenAuctions.length - 1; i >= 0; i--) {
                    if (onchainOpenAuctions[i].sellerID == callerInfo.username) {
                        onchainOpenAuctions.splice(i, 1);
                    } else {
                        delete onchainOpenAuctions[i].itemImage;
                        delete onchainOpenAuctions[i].aesKey;
                    }
                }
                return onchainOpenAuctions;
            } else {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }

    async getAuctionByID(auctionID, callerInfo) {
        try {
            let payloadForOnchain = [];
            payloadForOnchain.push(auctionID);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetAuctionByID", callerInfo.username, callerInfo.orgname);
            let onchainAuction = parseOnchainData(onchainResponse);
            if(onchainAuction){
                // do not expose the image and AES key
                delete onchainAuction.itemImage;
                delete onchainAuction.aesKey;

                return onchainAuction;
            } else {
                return [];
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Auction;