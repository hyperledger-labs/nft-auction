/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const nftCtrl = {}; //controller object

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const config = require('config');
const {errorResponse} = require('../object-builders/client-response-builder');
const NftService = require('../services/nft.service');

const log4js = require('log4js');
const logger = log4js.getLogger('nftCtrl');
logger.level = config.logLevel;

router.use(bodyParser.urlencoded({ extended: true }));

nftCtrl.createNft = async function (req, res) {
    logger.debug(">>> inside nftCtrl.createNft() ...");
    res.set('Content-Type', 'application/json');
    try {
        let nftService = new NftService();
        let response = await nftService.create(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

nftCtrl.transferNft = async function (req, res) {
    logger.debug(">>> inside nftCtrl.transferNft() ...");
    res.set('Content-Type', 'application/json');

    try {
        let nftService = new NftService();
        let response = await nftService.transfer(req.body, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

nftCtrl.transferNftEvent = async function (transferNftObj, username, orgname) {
    logger.debug(">>> inside nftCtrl.transferNftEvent() ...");
    try {
        let nftService = new NftService();
        await nftService.transferNftEvent(transferNftObj, username, orgname);
    } catch (error) {
        logger.error(error);
    }
}

nftCtrl.getNFTsByUser = async function (req, res) {
    logger.debug(">>> inside nftCtrl.getNFTsByUser() ...");
    res.set('Content-Type', 'application/json');
    try {
        let nftService = new NftService();
        let response = await nftService.getNftsByUser(req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

nftCtrl.getNftByID = async function (req, res) {
    logger.debug(">>> inside nftCtrl.getNftByID() ...");
    res.set('Content-Type', 'application/json');
    try {
        let nftService = new NftService();
        let response = await nftService.getNftByID(req.params.nftId, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

nftCtrl.getNftHistory = async function (req, res) {
    logger.debug(">>> inside nftCtrl.getNftHistory() ...");
    res.set('Content-Type', 'application/json');
    try {
        let nftService = new NftService();
        let response = await nftService.getNftHistory(req.params.nftId, req.decoded);
        return res.status(200).send(response);
    } catch (error) {
        logger.error(error);
        return res.status(401).send(errorResponse.format(error.message));
    }
}

//mandatary to export
module.exports = nftCtrl