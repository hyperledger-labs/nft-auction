/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

package main

import (
	"cycoreutils"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/pkg/errors"
	logger "github.com/sirupsen/logrus"
)

// createUser - creates a new User, store into chaincode state
// ================================================================================
func createUser(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for User : %s", args[0])

	if len(args) != 1 {
		logger.Debugf("Incorrect number of arguments. Expecting 1 %s")
	}

	objUser := &User{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), objUser)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arguments to a User object")).Error(), nil)
	}

	objUser.DocType = "USER"

	collectionName := ""

	objUserBytes, err := cycoreutils.QueryObject(stub, USER, []string{objUser.UserID}, collectionName)

	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", (errors.Wrapf(err, "Failed to query User object")).Error(), nil)
	}

	objUserBytes, err = cycoreutils.ObjecttoJSON(objUser)

	err = cycoreutils.UpdateObject(stub, USER, []string{objUser.UserID}, objUserBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRUPD007E", (errors.Wrapf(err, "Failed to to create User")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("CYUSRREC013S", fmt.Sprintf("User created Successfully!!!"), objUserBytes)
}

// getUserDetails - Get User Details by User ID
// ======================================================================================
func getUserDetails(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debug("Arguments for getUserDetails : %s", args[0])

	collectionName := ""

	// Get the User Information
	objUser, err := cycoreutils.QueryObject(stub, USER, []string{args[0]}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", (errors.Wrapf(err, "Failed to query if User exists")).Error(), nil)
	}
	if objUser == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("User does not exist"), nil)
	}

	return cycoreutils.ConstructResponse("CYUSRQUR010S", "", objUser)
}
