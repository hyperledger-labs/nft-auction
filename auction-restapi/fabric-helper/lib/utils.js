/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';
const fs = require('fs');
const path = require('path');

function fileExists(filename) {
  try {
    fs.accessSync(filename, fs.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function replaceCryptoData(filename, certName, certValue) {
  let data = fs.readFileSync(path.join(__dirname, filename));
  let result = data.toString().replace(certName, certValue.slice(1, -1));
  fs.writeFileSync(path.join(__dirname, filename), result);
}

exports.replaceCryptoData = replaceCryptoData;