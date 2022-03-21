/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

package cycoreutils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	logger "github.com/sirupsen/logrus"
)

// common function for unmarshalls : JSONtoObject function unmarshalls a JSON into an object
func JSONtoObject(data []byte, object interface{}) error {
	if err := json.Unmarshal([]byte(data), object); err != nil {
		logger.Errorf("Unmarshal failed : %s ", err.Error()) //SCOMCONV004E
		return err
	}
	logger.Debugf("**** %s is %+v: ", string(data), object)
	return nil
}

//  common function for marshalls :  ObjecttoJSON function marshalls an object into a JSON
func ObjecttoJSON(object interface{}) ([]byte, error) {
	var byteArray []byte
	var err error

	if byteArray, err = json.Marshal(object); err != nil {
		logger.Errorf("Marshal failed : %s ", err.Error()) //SCOMCONV005E
		return nil, err
	}

	if len(byteArray) == 0 {
		return nil, fmt.Errorf(("failed to convert object")) //SCOMLENB006E
	}
	logger.Debugf("**** %+v is %s: ", object, string(byteArray))
	return byteArray, nil
}

//GetBytes from string array
func GetBytes(sa []string) []byte {
	arrayBytes, _ := json.Marshal(sa)
	return arrayBytes
}

func CompareJSON(jsonString string, compareJson string) (bool, error) {
	var jsonIface interface{}
	var compareIface interface{}
	var msg = Response{}

	if err := JSONtoObject([]byte(jsonString), &jsonIface); err != nil {
		return false, fmt.Errorf("Unable to unmarshal original string " + err.Error())
	}

	if err := JSONtoObject([]byte(compareJson), &msg); err != nil {
		return false, fmt.Errorf("Unable to unmarshal message " + err.Error())
	}

	if err := JSONtoObject([]byte(msg.ObjectBytes), &compareIface); err != nil {
		return false, fmt.Errorf("Unable to unmarshal compare string")
	}
	return reflect.DeepEqual(jsonIface, compareIface), nil
}

func generateAndCompareHash(inputHash string, data string, key string) (bool, error) {
	//Calculate the address of the incoming data
	logger.Infof("gnc Hash Object %s", data)
	logger.Infof("gnc Key %s", key)
	logger.Infof("gnc Length of input %d", len(data))
	hData := hmac.New(sha256.New, []byte(key))
	hData.Write([]byte(data))
	hash := base64.StdEncoding.EncodeToString(hData.Sum(nil))
	logger.Infof("gnc Hash %s", hash)

	//Compare the hash of the ledger address to the has of the incoming data
	if strings.Compare(hash, inputHash) != 0 {
		msgBytes, _ := GetMessageDetail("SHASHERR001E", fmt.Sprintf("Hash comparison has not been successful"))
		return false, fmt.Errorf(string(msgBytes))
	}
	return true, nil
}

func GenerateHash(data string, key string) (string, error) {
	// Calculate the address of the incoming data
	logger.Infof("Hash Object %s", data)
	logger.Infof("HaKey %s", key)
	logger.Infof("Size of register data %d", len(data))
	hData := hmac.New(sha256.New, []byte(key))
	hData.Write([]byte(data))
	hash := base64.StdEncoding.EncodeToString(hData.Sum(nil))
	logger.Infof("Hash %s", hash)

	return hash, nil
}
