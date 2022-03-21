const constants = require('../constants');
const dateUtil = require('../helpers/date-helper');
const util = require('../helpers/util');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const dataModels = {
    itemOnchainStruct: (payload, imageName, imageHash, signedDataStr) => {
        // item object
        let struct = {
            itemDescription: payload.itemDescription,
            itemDetail: payload.itemDetail,
            numberOfCopies: payload.numberOfCopies,
            itemDate: payload.itemDate,
            itemType: payload.itemType,
            itemSubject: payload.itemSubject,
            itemMedia: payload.itemMedia,
            itemSize: payload.itemSize,
            itemImageType: payload.itemImageType,
            docType: "ARTINV",
            objectCat: "ART",
            itemImageName: imageName,
            itemID: uuidv4().toString(),
            timeStamp: dateUtil.getTimestamp(),
            itemHash: imageHash,
            itemHashSignature: signedDataStr
        };


        return struct;
    },

    nftOnchainStruct: (item, payload, username, aesKey) => {

        let struct = {
            docType: "NFT",
            name: "AUCNFT",
            symbol: "AUC",
            owner: username,
            aesKey: aesKey,
            itemID: item.itemID,
            itemImage: util.encrypt(payload.itemImage, aesKey),
            price: payload.itemBasePrice,
            timeStamp: dateUtil.getTimestamp()
        };

        return struct;
    },

    transferNftOnchainStruct: (payload, username) => {
        // generate random AES key for the new nft
        let newAESKey = crypto.randomBytes(32).toString('base64');

        let struct = {
            nftId: payload.nftId,
            ownerID: username,
            ownerAESKey: payload.ownerAESKey,
            transferee: payload.transferee,
            transfereeAESKey: newAESKey,
            itemImage: util.encrypt(payload.itemImage, newAESKey),
            itemPrice: payload.itemPrice || "",
            timeStamp: dateUtil.getTimestamp()
        }

        return struct;
    },

    auctionOnchainStruct: (payload, username) => {

        let struct = {
            docType: "AUCREQ",
            status: "INIT",
            nftId: payload.nftId,
            aesKey: payload.aesKey,
            auctionHouseID: payload.auctionHouseID,
            requestDate: payload.requestDate,
            reservePrice: payload.reservePrice,
            buyItNowPrice: payload.buyItNowPrice,
            auctionID: uuidv4().toString(),
            sellerID: username,
            timeStamp: dateUtil.getTimestamp()
        }

        return struct;
    },

    openAuctionOnchainStruct: (payload) => {

        let struct = {
            docType: "OPENAUC",
            auctionStartDateTime: dateUtil.getTimestamp(),
            auctionRequestID: payload.auctionRequestID,
            duration: payload.duration
        }

        return struct;
    },

    bidOnchainStruct: (payload, username) => {

        let struct = {
            docType : "BID",
            auctionID: payload.auctionID,
            bidPrice: payload.bidPrice,
            buyerID: username,
            bidID: uuidv4().toString(),
            bidTime: dateUtil.getTimestamp()
        }

        return struct;
    },
}

module.exports = dataModels;