const config = require('config');
const helper = require('../helpers/fabric-helper');
const util = require('../helpers/util');
const mime = require('mime-types');
const crypto = require('crypto');
const path = require('path');
const dateUtil = require('../helpers/date-helper');
const { parseOnchainData } = require('../helpers/onchainDataParser');
const objectBuilder = require('../object-builders');
const images = require("images");

const log4js = require('log4js');
const constants = require('../constants');
const logger = log4js.getLogger('bidService');
logger.level = config.logLevel;

class Bid {

    async postBid(payload, callerInfo) {
        try {
            let bidObj = objectBuilder.bidOnchainStruct(payload, callerInfo.username);

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(bidObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "PostBid", callerInfo.username, callerInfo.orgname);
            let onchainBid = parseOnchainData(onchainResponse);
            if (onchainBid) {
                let jsonResponse = {
                    status: constants.onchainStatus.success,
                    message: onchainResponse.detail
                };
                return jsonResponse;
            };
        } catch (error) {
            throw error;
        }
    }

    async buyItNow(payload, callerInfo) {
        try {
            payload.docType = "BID";
            payload.buyerID = callerInfo.username;
            payload.bidTime = dateUtil.getTimestamp();

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(payload));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "BuyItNow", callerInfo.username, callerInfo.orgname);

            let jsonResponse = {
                status: constants.onchainStatus.success,
                message: onchainResponse.detail
            };
            return jsonResponse;

        } catch (error) {
            throw error;
        }
    }

    async getBidsByAuctionID(auctionID, callerInfo) {
        try {

            let payloadForOnchain = [];
            payloadForOnchain.push(auctionID);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetBidsByAuctionID", callerInfo.username, callerInfo.orgname);
            let onchainBid = parseOnchainData(onchainResponse);
            if (onchainBid) {
                return onchainBid;
            } else {
                return [];
            };
        } catch (error) {
            throw error;
        }
    }

    async getHighestBid(auctionID, callerInfo) {
        try {

            let payloadForOnchain = [];
            payloadForOnchain.push(auctionID);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetHighestBid", callerInfo.username, callerInfo.orgname);
            let onchainBid = parseOnchainData(onchainResponse);
            if (onchainBid) {
                return onchainBid;
            }
        } catch (error) {
            throw error;
        }
    }

    async getBidByID(bidID, callerInfo) {
        try {

            let payloadForOnchain = [];
            payloadForOnchain.push(bidID);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetBidByID", callerInfo.username, callerInfo.orgname);
            let onchainBid = parseOnchainData(onchainResponse);
            if (onchainBid) {
                return onchainBid;
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Bid;