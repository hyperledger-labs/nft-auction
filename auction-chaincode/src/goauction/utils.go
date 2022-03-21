/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
	logger "github.com/sirupsen/logrus"
)

/////////////////////////////////////////////////////
// Constant for table names
/////////////////////////////////////////////////////
const (
	USER     string = "USER"
	ARTINV   string = "ARTINV"
	NFT      string = "NFT"
	ITEMLOG  string = "ITEMLOG"
	CATEGORY string = "CATEGORY"
	AUCREQ   string = "AUCREQ"
	AUCINIT  string = "AUCINIT"
	AUCOPEN  string = "AUCOPEN"
	BID      string = "BID"
	POSTTRAN string = "POSTTRAN"
)

/////////////////////////////////////////////////////
// ART Inventory (Item) Status
/////////////////////////////////////////////////////
const (
	INITIAL     string = "INITIAL"
	READYFORAUC string = "READYFORAUC"
	TRANSFER    string = "TRANSFER"
)

/////////////////////////////////////////////////////
// Auctioned by
/////////////////////////////////////////////////////
const (
	DEFAULT string = "DEFAULT"
	NA      string = "NA"
)

/////////////////////////////////////////////////////
// Transaction Types
/////////////////////////////////////////////////////
const (
	SALE string = "SALE"
)

/////////////////////////////////////////////////////
// Auction status
/////////////////////////////////////////////////////
const (
	INIT   string = "INIT"
	OPEN   string = "OPEN"
	CLOSED string = "CLOSED"
)

// Response -  Object to store Response Status and Message
// ================================================================================
// type Response struct {
// 	Status  string `json:"status"`
// 	Message string `json:"message"`
// }

// getSuccessResponse - Create Success Response and return back to the calling application
// ================================================================================
func getSuccessResponse(message string) pb.Response {
	objResponse := Response{Status: "200", Message: message}
	logger.Info("getSuccessResponse: Called For: ", objResponse)
	response, err := json.Marshal(objResponse)
	if err != nil {
		logger.Errorf(fmt.Sprintf("Invalid function %s", err))
	}
	return shim.Success(response)
}

// getErrorResponse - Create Error Response and return back to the calling application
// ================================================================================
func getErrorResponse(message string) pb.Response {
	objResponse := Response{Status: "500", Message: message}
	logger.Info("getErrorResponse: Called For: ", objResponse)
	response, err := json.Marshal(objResponse)
	if err != nil {
		logger.Errorf(fmt.Sprintf("Invalid function %s", err))
	}
	return shim.Success(response)
}

// updateObject - Replace current data with replacement
// ================================================================================
func updateObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte) error {
	// Check number of keys
	err := verifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return err
	}

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Add Object JSON to state
	err = stub.PutState(compositeKey, objectData)
	if err != nil {
		logger.Errorf("updateObject() : Error inserting Object into State Database %s", err)
		return err
	}
	logger.Debugf("updateObject() : Successfully updated record of type %s", objectType)

	return nil
}

// replaceObject - Replaces the Entry in the Ledger
// The existing object is simply queried and the data contents is replaced with
// new content
// ================================================================================
func replaceObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte) error {
	// Check number of keys
	err := verifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return err
	}

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Add Party JSON to state
	err = stub.PutState(compositeKey, objectData)
	if err != nil {
		logger.Debugf("ReplaceObject() : Error replacing Object in State Database %s", err)
		return err
	}

	logger.Debugf("ReplaceObject() : %s - end init object ", objectType)
	return nil
}

// queryObject - Query a User Object by Object Name and Key
// This has to be a full key and should return only one unique object
// ================================================================================
func queryObject(stub shim.ChaincodeStubInterface, objectType string, keys []string) ([]byte, error) {
	// Check number of keys
	err := verifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return nil, err
	}

	compoundKey, _ := stub.CreateCompositeKey(objectType, keys)
	logger.Debugf("queryObject() : Compound Key : %s", compoundKey)

	objBytes, err := stub.GetState(compoundKey)
	if err != nil {
		return nil, err
	}

	return objBytes, nil
}

// verifyAtLeastOneKeyIsPresent - This function verifies if the number of key
// provided is at least 1 and
// < the max keys defined for the Object
// ================================================================================
func verifyAtLeastOneKeyIsPresent(args []string) error {
	// Check number of keys
	nKeys := len(args)

	if nKeys < 1 {
		err := fmt.Sprintf("verifyAtLeastOneKeyIsPresent() Failed: Atleast 1 Key must be needed :  nKeys : %s", strconv.Itoa(nKeys))
		logger.Debugf("verifyAtLeastOneKeyIsPresent() Failed: Atleast 1 Key must be needed :  nKeys : %s", strconv.Itoa(nKeys))
		return errors.New(err)
	}

	return nil
}

// jsonToObject (Serialize) : Unmarshalls a JSON into an object
// ================================================================================
func jsonToObject(data []byte, object interface{}) error {
	if err := json.Unmarshal([]byte(data), object); err != nil {
		logger.Errorf("Unmarshal failed : %s ", err.Error()) //SCOMCONV004E
		return err
	}
	return nil
}

// objectToJSON (Deserialize) :  Marshalls an object into a JSON
// ================================================================================
func objectToJSON(object interface{}) ([]byte, error) {
	var byteArray []byte
	var err error

	if byteArray, err = json.Marshal(object); err != nil {
		logger.Errorf("Marshal failed : %s ", err.Error())
		return nil, err
	}

	if len(byteArray) == 0 {
		return nil, fmt.Errorf(("failed to convert object"))
	}
	return byteArray, nil
}
