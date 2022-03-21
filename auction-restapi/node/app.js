/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('auction-app');

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const util = require('util');
const app = express();
const cors = require('cors');
const config = require('config');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const helper = require('./app/helpers/fabric-helper');
const eventHelper = require('./app/helpers/event-helper');
const expressOasGenerator = require('express-oas-generator');
const {errorResponse} = require('./app/object-builders/client-response-builder');
const {clientErrorHandler,errorHandler} = require('./app/helpers/errorhandlers');
const auth = require('./app/middlewares/auth');
const WebSocket = require('ws');
let webSocketClients = [];

logger.level = config.logLevel;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'local'
}

//define the project routes ...
const auction = require("./app/routes/auction");
const user = require("./app/routes/user");
const nft = require("./app/routes/nft");
const bid = require("./app/routes/bid");

const host = process.env.HOST || config.host;
const port = process.env.PORT || config.port;

app.options('*', cors());
app.use(cors());
app.use(express.static('public'))
app.use(bodyParser({ limit: '50mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('client/build'));

// set up swagger
fs.readFile('public/swagger/data.json', 'utf8', function (err, data) {
  expressOasGenerator.init(app, JSON.parse(data));
});

// route middleware to verify a token ... all routes below will be require to authenticate ...
app.use(auth.authenticate);

app.use("/auction", auction);
app.use("/user", user);
app.use("/nft", nft);
app.use("/bid", bid);

// error handling
app.use((req, res) => res.status(404).send(errorResponse.format("Router not found")));

app.use(clientErrorHandler);
app.use(errorHandler);

const server = http.createServer(app).listen(port, async function () {
  await Promise.all([helper.enrollAdmin("org1")]).then((result) => {
    logger.info('Successfully enrolled admin users');
  }, (err) => {
    logger.error('Failed to enroll admin users', err);
  });

  let wss = new WebSocket.Server({ server: server });

  wss.on('connection', function (ws) {
    webSocketClients.push(ws);
    ws.on('close', function (code, reason) {
      logger.info('client closed', 'path', code, reason);
    });
    ws.on('message', function (data) {
      logger.info('message from client', data);
    });
  });

  eventHelper.registerEvent(sendAll);
  logger.info('****************** SERVER STARTED ************************');
  logger.info('**************  http://' + host + ':' + port + ' ******************');
});

function sendAll(message) {
  webSocketClients.forEach(function (item, index, object) {
    if (webSocketClients[index].readyState != webSocketClients[index].OPEN) {
      object.splice(index, 1);
    }
  });
  for (let i = 0; i < webSocketClients.length; i++) {
    if (webSocketClients[i].readyState == webSocketClients[i].OPEN) {
      webSocketClients[i].send(JSON.stringify(message));
    }
  }
}

server.timeout = 240000;
