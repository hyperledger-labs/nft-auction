/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const bidCtrl = {}; //controller object

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const helper = require('../helpers/fabric-helper');
const config = require('config');
const { v4: uuidv4 } = require('uuid');
const dateUtil = require('../helpers/date-helper');
const {errorResponse} = require('../object-builders/client-response-builder');
const BidService = require('../services/bid.service');

const log4js = require('log4js');
const logger = log4js.getLogger('bidCtrl');
logger.level = config.logLevel;

router.use(bodyParser.urlencoded({ extended: true }));

bidCtrl.postBid = async function (req, res) {
    logger.debug(">>> inside bidCtrl.postBid() ...");
    res.set('Content-Type', 'application/json');
    try {
        let bidService = new BidService();
        let response = await bidService.postBid(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

bidCtrl.buyItNow = async function (req, res) {
    logger.debug(">>> inside bidCtrl.buyItNow() ...");
    res.set('Content-Type', 'application/json');
    try {
        let bidService = new BidService();
        let response = await bidService.buyItNow(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

bidCtrl.getBidsByAuctionID = async function (req, res) {
    logger.debug(">>> inside bidCtrl.getBidsByAuctionID() ...");
    res.set('Content-Type', 'application/json');
    try {
        let bidService = new BidService();
        let response = await bidService.getBidsByAuctionID(req.params.auctionID, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

bidCtrl.getHighestBid = async function (req, res) {
    logger.debug(">>> inside bidCtrl.getHighestBid() ...");
    res.set('Content-Type', 'application/json');
    try {
        let bidService = new BidService();
        let response = await bidService.getHighestBid(req.params.auctionID, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

bidCtrl.getBidByID = async function (req, res) {
    logger.debug(">>> inside bidCtrl.getBidByID() ...");
    res.set('Content-Type', 'application/json');
    try {
        let bidService = new BidService();
        let response = await bidService.getBidByID(req.params.bidID, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

//mandatary to export
module.exports = bidCtrl