/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const auctionCtrl = {}; //controller object

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const config = require('config');
const {errorResponse} = require('../object-builders/client-response-builder');
const AuctionService = require('../services/auction.service');

const log4js = require('log4js');
const logger = log4js.getLogger('auctionCtrl');
logger.level = config.logLevel;

router.use(bodyParser.urlencoded({ extended: true }));

auctionCtrl.initAuction = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.initAuction() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.initAuction(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

auctionCtrl.openAuction = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.openAuction() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.openAuction(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

auctionCtrl.closeOpenAuction = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.closeOpenAuction() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.closeOpenAuction(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

auctionCtrl.getInitAuctions = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.getInitAuctions() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.getInitAuctions(req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

auctionCtrl.getOpenAuctions = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.getOpenAuctions() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.getOpenAuctions(req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

auctionCtrl.getAuctionByID = async function (req, res) {
    logger.debug(">>> inside auctionCtrl.getAuctionByID() ...");
    res.set('Content-Type', 'application/json');
    try {
        let auctionService = new AuctionService();
        let response = await auctionService.getAuctionByID(req.params.auctionID, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

//mandatary to export
module.exports = auctionCtrl