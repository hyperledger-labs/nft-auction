const config = require('config');
const helper = require('../helpers/fabric-helper');
const util = require('../helpers/util');
const mime = require('mime-types');
const dateUtil = require('../helpers/date-helper');
const crypto = require('crypto');
const path = require('path');
const { parseOnchainData } = require('../helpers/onchainDataParser');
const objectBuilder = require('../object-builders');
const images = require("images");

const log4js = require('log4js');
const logger = log4js.getLogger('nftService');
logger.level = config.logLevel;

// **** helper functions ****
function groupNftsByItemID(onchainNfts) {
    return onchainNfts.reduce((groups, nft) => {
        const group = (groups[nft.itemID] || []);
        group.push(nft);
        groups[nft.itemID] = group;
        return groups;
    }, {});
}

class Nft {

    // create NFT along with the item metadata
    async create(payload, callerInfo) {

        try {
            // retrieve base64 image from the payload
            let base64Image = payload.itemImage.split(';base64,').pop();
            // generate a name for the image to save as a file
            let imageName = payload.itemDetail + "." + mime.extension(payload.itemImageType);
            // generate hash of the image
            let imageHash = await util.calculateHash(payload.itemImage);
            // sign the image hash with user's private key
            let signedDataBytes = await helper.userSignature(callerInfo.username, imageHash);
            let signedDataStr = signedDataBytes.toString('base64');
            // generate aes key
            let aesKey = crypto.randomBytes(32).toString('base64');

            let item = objectBuilder.itemOnchainStruct(payload, imageName, imageHash, signedDataStr);
            let nft = objectBuilder.nftOnchainStruct(item, payload, callerInfo.username, aesKey);

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(item));
            payloadForOnchain.push(JSON.stringify(nft));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "recordItemObject", callerInfo.username, callerInfo.orgname);
            let onchainItem = parseOnchainData(onchainResponse);

            images(Buffer.from(base64Image, 'base64'))
                .size(400)
                .save(path.join(__dirname + "../../../public/images", imageName), {
                    quality: 50
                });

            if (onchainItem) {
                let payloadForOnchain = [];
                payloadForOnchain.push(onchainItem.itemID);

                // get all NFTs created against the item
                let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetNftListByItemId", callerInfo.username, callerInfo.orgname);
                let onchainNfts = parseOnchainData(onchainResponse);

                // decrypt image in each nft object
                for (let i = 0; i < onchainNfts.length; i++) {
                    onchainNfts[i].itemImage = util.decrypt(onchainNfts[i].itemImage, aesKey);
                }

                // send item object and nfts list as the response
                let jsonResponse = {};
                jsonResponse.item = onchainItem;
                jsonResponse.nfts = onchainNfts;

                return jsonResponse;
            }
        } catch (error) {
            throw error;
        }
    }

    // transfer an NFT
    async transfer(payload, callerInfo) {
        try {
            let transferNftObj = objectBuilder.transferNftOnchainStruct(payload, callerInfo.username);

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(transferNftObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "TransferNft", callerInfo.username, callerInfo.orgname);
            let onchainNft = parseOnchainData(onchainResponse);
            if (onchainNft) {
                // remove the itemImage and aesKey from the response to ensure that these are only exposed to the nft's owner
                delete onchainNft.itemImage;
                delete onchainNft.aesKey;

                return onchainNft;
            };
        } catch (error) {
            throw error;
        }
    }

    // handle NFT transfer events
    async transferNftEvent(transferNftObj, username, orgname) {

        try {
            transferNftObj.itemImage = util.decrypt(transferNftObj.itemImage, transferNftObj.ownerAESKey);
            transferNftObj.transfereeAESKey = crypto.randomBytes(32).toString('base64');
            transferNftObj.itemImage = util.encrypt(transferNftObj.itemImage, transferNftObj.transfereeAESKey);
            transferNftObj.timeStamp = dateUtil.getTimestamp();

            let payloadForOnchain = [];
            payloadForOnchain.push(JSON.stringify(transferNftObj));

            let onchainResponse = await helper.invokeTransaction(config.channelName, config.chaincodeName, payloadForOnchain, "TransferNft", username, orgname);
            let onchainNft = parseOnchainData(onchainResponse);
            if (onchainNft) {
                logger.info("Transfer Item successfull: " + transferNftObj.nftId)
            };
        } catch (error) {
            logger.debug(error);
            logger.error("Transfer Item Failed: " + transferNftObj.nftId)
        }
    }

    // get all the NFTs owned by a user
    async getNftsByUser(callerInfo) {
        try {
            let payloadForOnchain = [];
            payloadForOnchain.push(callerInfo.username);

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "GetNftListByUser", callerInfo.username, callerInfo.orgname);
            let onchainNfts = parseOnchainData(onchainResponse);
            if (onchainNfts) {
                let jsonResponse = [];
                // group all nfts by itemID
                const groups = groupNftsByItemID(onchainNfts);
                // delete itemImage from all the queried Nft objects
                for (var i = 0, len = onchainNfts.length; i < len; i++) {
                    delete onchainNfts[i].itemImage;
                }
                let items = Object.keys(groups);
                for (let i = 0; i < items.length; i++) {

                    let nft = { itemID: items[i] };

                    let payloadForOnchain = [];
                    payloadForOnchain.push(JSON.stringify(nft));

                    // get item object for each NFT 
                    let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "queryItemObject", callerInfo.username, callerInfo.orgname);
                    let onchainItem = parseOnchainData(onchainResponse);

                    jsonResponse.push({ item: onchainItem, nfts: groups[nft.itemID] })
                }
                return jsonResponse;
            } else {
                return [];
            };
        } catch (error) {
            throw error;
        }
    }

    // get an NFT by NftId
    async getNftByID(nftId, callerInfo) {
        try {
            let payloadForOnchain = [];
            let nft = { nftId: nftId };
            payloadForOnchain.push(JSON.stringify(nft));

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "queryNftObject", callerInfo.username, callerInfo.orgname);
            let onchainNft = parseOnchainData(onchainResponse);
            if (onchainNft) {
                // decrypt the image only if the api caller is owner of the NFT
                if (onchainNft.owner == callerInfo.username) {
                    onchainNft.itemImage = util.decrypt(onchainNft.itemImage, onchainNft.aesKey);
                }
                else {
                    // do not expose the image and AES key if the api caller is not the owner of the NFT
                    delete onchainNft.itemImage;
                    delete onchainNft.aesKey;
                }

                let nft = { itemID: onchainNft.itemID };

                let payloadForOnchain = [];
                payloadForOnchain.push(JSON.stringify(nft));

                let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "queryItemObject", callerInfo.username, callerInfo.orgname);
                let onchainItem = parseOnchainData(onchainResponse);

                // send item object and nft object as the response
                let jsonResponse = {};
                jsonResponse.item = onchainItem;
                jsonResponse.nft = onchainNft;

                return jsonResponse;
            };
        } catch (error) {
            throw error;
        }
    }

    // get the history of an NFT
    async getNftHistory(nftId, callerInfo) {
        try {
            let payloadForOnchain = [];
            let nft = { nftId: nftId };
            payloadForOnchain.push(JSON.stringify(nft));

            let onchainResponse = await helper.queryChaincode(config.channelName, config.chaincodeName, payloadForOnchain, "queryNftObjectHistory", callerInfo.username, callerInfo.orgname);
            let onchainNftVersions = parseOnchainData(onchainResponse);
            if (onchainNftVersions) {
                let history = [];
                for (const version of onchainNftVersions) {
                    let jsonResponse = {}
                    jsonResponse.txID = version.TxId;
                    jsonResponse.nftStatus = version.Value.nftStatus;
                    jsonResponse.ownerID = version.Value.owner;
                    jsonResponse.timestamp = version.Timestamp;

                    history.push(jsonResponse);
                }
                
                return history;
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Nft;