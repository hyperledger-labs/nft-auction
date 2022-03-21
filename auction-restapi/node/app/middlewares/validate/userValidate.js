/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

'use strict';

const Joi = require('@hapi/joi');
const { errorResponse } = require('../../object-builders/client-response-builder');

// ******************************************************************
// *** helper functions ***
// request body validation and error handling middleware function
function schemaValidationWithErrorHandling(schema, req, next, res) {
	try {
		validateSchema(schema, req);
		next();
	} catch (error) {
		res.status(500).send(errorResponse.format(error.message));
	}
}

function validateSchema(schema, req) {
	const validationResponse = schema.validate(req.body);
	if (validationResponse.error) {
		throw new Error(validationResponse.error.message);
	}
}
// ******************************************************************

const keys = {
	userID: Joi.string().trim().min(1),
	name: Joi.string().trim().min(1),
	password: Joi.string().trim().min(1),
	userType: Joi.string().trim().min(1).uppercase().valid("AH", "TRD"),
	email: Joi.string().trim().min(1).lowercase().email(),
	address: Joi.string().trim().min(1),
	phone: Joi.string().trim().min(1),
	org: Joi.string().trim().min(1),
	paymentID: Joi.string().trim().min(1)
};

const UserValidate = {

	login: (req, res, next) => {
		const schema = Joi.object().keys(
			{
				username: keys.userID.required(),
				password: keys.password.required(),
				org: keys.org.required()
			}
		);
		schemaValidationWithErrorHandling(schema, req, next, res);
	},

	register: (req, res, next) => {
		const schema = Joi.object().keys(
			{
				userID: keys.userID.required(),
				name: keys.name.required(),
				password: keys.password.required(),
				userType: keys.userType.required(),
				email: keys.email.required(),
				address: keys.address.required(),
				phone: keys.phone.required(),
				paymentID: keys.paymentID.required()
			}
		);
		schemaValidationWithErrorHandling(schema, req, next, res);
	},

	updatePassword: (req, res, next) => {
		const schema = Joi.object().keys(
			{
				password: keys.password,
				newPassword: keys.password
			}
		);
		schemaValidationWithErrorHandling(schema, req, next, res);
	},
};

module.exports = UserValidate;