/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use-strict'
const config = require('config');
const moment = require('moment');

var getTimestamp = function () {
    return moment.utc().format(config.dateFormat);
}

exports.getTimestamp = getTimestamp