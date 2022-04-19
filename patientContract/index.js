/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const PatientContract = require('./lib/PatientContract');

module.exports.PatientContract = PatientContract;
module.exports.contracts = [ PatientContract ];

