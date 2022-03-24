/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

const express = require('express');
const router = express.Router();
const log4js = require('log4js');
const logger = log4js.getLogger('index');
const auctionCtrl = require('../controllers/auctionCtrl');
const config = require('config');
logger.level = config.logLevel;

router.post('/init', auctionCtrl.initAuction);
router.post('/open', auctionCtrl.openAuction);
router.post('/close', auctionCtrl.closeOpenAuction);
router.get('/open', auctionCtrl.getOpenAuctions);
router.get('/open/auctionHouse', auctionCtrl.getOpenAuctionsByAH);
router.get('/init', auctionCtrl.getInitAuctionsByAH);
router.get('/:auctionID', auctionCtrl.getAuctionByID);

//mandatary to export
module.exports = router;