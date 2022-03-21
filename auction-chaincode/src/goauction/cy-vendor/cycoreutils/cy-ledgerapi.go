/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

package cycoreutils

import (
	"bytes"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	logger "github.com/sirupsen/logrus"
)

////////////////////////////////////////////////////////////////////////////
// Update the Object - Replace current data with replacement
// Register users into this table
////////////////////////////////////////////////////////////////////////////
func UpdateObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte, collectionName string) error {
	// Check number of keys
	err := VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return err
	}

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)
	logger.Info("cycoreutils.UpdateObject() : Composite Key : ", compositeKey)

	// Add Object JSON to state
	if collectionName == "" {
		err = stub.PutState(compositeKey, objectData)
	} else {
		err = stub.PutPrivateData(collectionName, compositeKey, objectData)
	}
	if err != nil {
		logger.Errorf("cycoreutils.UpdateObject() : Error inserting Object into State Database %s", err)
		return err
	}

	return nil

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Retrieve the object based on the key and simply delete it
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func DeleteObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, collectionName string) error {
	// Check number of keys
	err := VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return err
	}

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Remove object from the State Database
	if collectionName == "" {
		err = stub.DelState(compositeKey)
	} else {
		err = stub.DelPrivateData(collectionName, compositeKey)
	}
	if err != nil {
		logger.Errorf("cycoreutils.DeleteObject() : Error deleting Object into State Database %s", err)
		return err
	}
	logger.Debug("cycoreutils.DeleteObject() : ", "Object : ", objectType, " Key : ", compositeKey)

	return nil
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Delete all objects of ObjectType
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func DeleteAllObjects(stub shim.ChaincodeStubInterface, objectType string) error {
	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, []string{""})

	// Remove object from the State Database
	err := stub.DelState(compositeKey)
	if err != nil {
		logger.Errorf("cycoreutils.DeleteAllObjects() : Error deleting all Object into State Database %s", err)
		return err
	}
	logger.Debug("DeleteAllObjects() : ", "Object : ", objectType, " Key : ", compositeKey)

	return nil
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Replaces the Entry in the Ledger
// The existing object is simply queried and the data contents is replaced with
// new content
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func ReplaceObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, objectData []byte, collectionName string) error {
	// Check number of keys
	err := VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return err
	}

	// Convert keys to  compound key
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)

	// Add Party JSON to state
	if collectionName == "" {
		err = stub.PutState(compositeKey, objectData)
	} else {
		err = stub.PutPrivateData(collectionName, compositeKey, objectData)
	}
	if err != nil {
		fmt.Printf("ReplaceObject() : Error replacing Object in State Database %s", err)
		return err
	}

	fmt.Println("ReplaceObject() : - end init object ", objectType)
	return nil
}

////////////////////////////////////////////////////////////////////////////
// Query a User Object by Object Name and Key
// This has to be a full key and should return only one unique object
////////////////////////////////////////////////////////////////////////////
func QueryObject(stub shim.ChaincodeStubInterface, objectType string, keys []string, collectionName string) ([]byte, error) {
	// Check number of keys
	var objBytes []byte
	var err error

	err = VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return nil, err
	}

	compoundKey, _ := stub.CreateCompositeKey(objectType, keys)
	logger.Info("cycoreutils.QueryObject() : Compound Key : ", compoundKey)

	if collectionName == "" {
		objBytes, err = stub.GetState(compoundKey)
	} else {
		objBytes, err = stub.GetPrivateData(collectionName, compoundKey)
	}
	if err != nil {
		return nil, err
	}

	return objBytes, nil
}

////////////////////////////////////////////////////////////////////////////
// Query a User Object by Object Name and Key
// This has to be a full key and should return only one unique object
////////////////////////////////////////////////////////////////////////////
func QueryObjectWithProcessingFunction(stub shim.ChaincodeStubInterface, objectType string, keys []string, fname func(shim.ChaincodeStubInterface, []byte, []string) error, collectionName string) ([]byte, error) {
	var objBytes []byte
	var err error

	// Check number of keys
	err = VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return nil, err
	}

	compoundKey, _ := stub.CreateCompositeKey(objectType, keys)
	logger.Info("cycoreutils.QueryObjectWithProcessingFunction: Compound Key : ", compoundKey)

	if collectionName == "" {
		objBytes, err = stub.GetState(compoundKey)
	} else {
		objBytes, err = stub.GetPrivateData(collectionName, compoundKey)
	}
	if err != nil {
		return nil, err
	}

	if objBytes == nil {
		return nil, fmt.Errorf("cycoreutils.QueryObjectWithProcessingFunction: No Data Found for Compound Key : %s", compoundKey)
	}

	// Perform Any additional processing of data
	logger.Debug("fname() : Successful - Proceeding to fname")

	err = fname(stub, objBytes, keys)
	if err != nil {
		logger.Error("cycoreutils.QueryObjectWithProcessingFunction() : Cannot execute  : ", fname)
		jsonResp := "{\"fname() Error\":\" Cannot create Object for key " + compoundKey + "\"}"
		return objBytes, errors.New(jsonResp)
	}

	return objBytes, nil
}

////////////////////////////////////////////////////////////////////////////
// Query a Object History by Object Name and Key
// This has to be a full key and should return list of ledger state - history transactions
////////////////////////////////////////////////////////////////////////////
func GetObjectHistory(stub shim.ChaincodeStubInterface, objectType string, keys []string) ([]byte, error) {
	var buffer bytes.Buffer

	err := VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return nil, err
	}
	compositeKey, _ := stub.CreateCompositeKey(objectType, keys)
	logger.Info("cycoreutils.GetObjectHistory() : Compound Key : ", compositeKey)
	resultsIterator, err := stub.GetHistoryForKey(compositeKey)

	defer resultsIterator.Close()

	if err != nil {
		return nil, err
	}
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false

	var index = 1

	for resultsIterator.HasNext() {
		var version = "V" + strconv.Itoa(index)
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}

		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"TxVersion\":")
		buffer.WriteString("\"")
		buffer.WriteString(version)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value as is
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
		index = index + 1
	}
	buffer.WriteString("]")
	logger.Debugf("cycoreutils.GetObjectHistory(): Result:\n%s\n", buffer.String())

	if buffer.String() == "[]" {
		return nil, nil
	}
	return buffer.Bytes(), nil
}

////////////////////////////////////////////////////////////////////////////
// Get a List of Rows based on query criteria from the OBC
// The GetKeyList Function
////////////////////////////////////////////////////////////////////////////
func GetKeyList(stub shim.ChaincodeStubInterface, args []string, collectionName string) (shim.StateQueryIteratorInterface, error) {
	var resultsIterator shim.StateQueryIteratorInterface
	var err error

	// Define partial key to query within objects namespace (objectType)
	objectType := args[0]

	// Check number of keys

	err = VerifyAtLeastOneKeyIsPresent(args[1:])
	if err != nil {
		return nil, err
	}

	// Execute the Query
	// This will execute a key range query on all keys starting with the compound key
	if collectionName == "" {
		resultsIterator, err = stub.GetStateByPartialCompositeKey(objectType, args[1:])
	} else {
		resultsIterator, err = stub.GetPrivateDataByPartialCompositeKey(collectionName, objectType, args[1:])
	}

	if err != nil {
		return nil, err
	}

	defer resultsIterator.Close()

	// Iterate through result set
	var i int
	for i = 0; resultsIterator.HasNext(); i++ {

		// Retrieve the Key and Object
		myCompositeKey, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		logger.Debug("cycoreutils.GetKeyList() : my Value : ", myCompositeKey)
	}
	return resultsIterator, nil
}

///////////////////////////////////////////////////////////////////////////////////////////
// GetQueryResultForQueryString executes the passed in query string.
// Result set is built and returned as a byte array containing the JSON results.
///////////////////////////////////////////////////////////////////////////////////////////
func GetQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string, collectionName string) ([]byte, error) {
	logger.Infof("GetQueryResultForQueryString() : queryString:\n%s\n", queryString)

	var resultsIterator shim.StateQueryIteratorInterface
	var err error

	if collectionName == "" {
		resultsIterator, err = stub.GetQueryResult(queryString)
	} else {
		resultsIterator, err = stub.GetPrivateDataQueryResult(collectionName, queryString)
	}
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		//buffer.WriteString("{\"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		//buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	logger.Debugf("cycoreutils.GetQueryResultForQueryString(): queryResult:\n%s\n", buffer.String())

	if buffer.String() == "[]" {
		return nil, nil
	}
	return buffer.Bytes(), nil
}

///////////////////////////////////////////////////////////////////////////////////////////
// GetIteratorForQueryString executes the passed in query string.
// Result set - Iterator is returned.
///////////////////////////////////////////////////////////////////////////////////////////
func GetIteratorForQueryString(stub shim.ChaincodeStubInterface, queryString string, collectionName string) (shim.StateQueryIteratorInterface, error) {
	logger.Infof("cycoreutils.GetIteratorForQueryString() : queryString:\n%s\n", queryString)

	var resultsIterator shim.StateQueryIteratorInterface
	var err error

	if collectionName == "" {
		resultsIterator, err = stub.GetQueryResult(queryString)
	} else {
		resultsIterator, err = stub.GetPrivateDataQueryResult(collectionName, queryString)
	}
	if err != nil {
		return nil, err
	}

	return resultsIterator, nil
}

////////////////////////////////////////////////////////////////////////////
// Get a List of Rows based on query criteria from the OBC
// The getList Function
////////////////////////////////////////////////////////////////////////////
func GetList(stub shim.ChaincodeStubInterface, objectType string, keys []string, collectionName string) (shim.StateQueryIteratorInterface, error) {
	var resultIter shim.StateQueryIteratorInterface
	var err error

	// Check number of keys
	err = VerifyAtLeastOneKeyIsPresent(keys)
	if err != nil {
		return nil, err
	}

	// Get Result set
	if collectionName == "" {
		resultIter, err = stub.GetStateByPartialCompositeKey(objectType, keys)
	} else {
		resultIter, err = stub.GetPrivateDataByPartialCompositeKey(collectionName, objectType, keys)
	}
	logger.Infof("cycoreutils.GetList(): Retrieving Objects into an array")
	if err != nil {
		return nil, err
	}

	// Return iterator for result set
	// Use code above to retrieve objects
	return resultIter, nil
}

////////////////////////////////////////////////////////////////////////////
// This function verifies if the number of key provided is at least 1 and
// < the max keys defined for the Object
////////////////////////////////////////////////////////////////////////////

func VerifyAtLeastOneKeyIsPresent(args []string) error {
	// Check number of keys
	nKeys := len(args)
	if nKeys == 1 {
		return nil
	}

	if nKeys < 1 {
		err := fmt.Sprintf("VerifyAtLeastOneKeyIsPresent() Failed: Atleast 1 Key must is needed :  nKeys : %s", strconv.Itoa(nKeys))
		logger.Errorf("cycoreutils.VerifyAtLeastOneKeyIsPresent(): Error:%s", err)
		return errors.New(err)
	}

	return nil
}
