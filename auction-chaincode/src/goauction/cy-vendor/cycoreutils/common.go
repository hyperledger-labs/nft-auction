/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

package cycoreutils

import (
	"encoding/json"
	"sync"

	"reflect"
	"runtime"
	"strconv"
	"strings"

	logger "github.com/sirupsen/logrus"
)

var messageRepository *MessageRepository
var once sync.Once

type MessageRepository struct {
	Messages map[string]*json.RawMessage
}

type Response struct {
	Code        string `json:"code"`
	Status      string `json:"status"`
	Function    string `json:"function"`
	Description string `json:"description"`
	Detail      string `json:"detail"`
	ObjectBytes string `json:"objectBytes"`
}

func FormatFloat(num float64) string {
	return strconv.FormatFloat(num, 'f', -1, 64)
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if strings.ToLower(a) == strings.ToLower(b) {
			return true
		}
	}
	return false
}

func ToBeAddedParticipants(extParticipants []string, newParticipants []string) []string {
	for _, email := range newParticipants {
		if !stringInSlice(email, extParticipants) {
			extParticipants = append(extParticipants, email)
		}
	}
	return extParticipants
}

func getFunctionName() string {
	pc, _, _, _ := runtime.Caller(2)
	splits := strings.Split(runtime.FuncForPC(pc).Name(), "/")
	name := strings.Split(splits[len(splits)-1], ".")
	return name[len(name)-1]
}

////////////////////////////////////////////////////////////////////////////
// Query a User Object by Object Name and Key
// This has to be a full key and should return only one unique object
////////////////////////////////////////////////////////////////////////////
func GetMessageInstance() (*MessageRepository, error) {
	once.Do(func() {
		messageRepository = &MessageRepository{}

		if err := JSONtoObject(nlsMessages, &messageRepository.Messages); err != nil {
			logger.Errorf("GetMessageInstance(): err = %s", err.Error())
			return
		}
	})
	//logger.Debugf("GetMessageInstance(): messageRepository = %v", messageRepository)
	return messageRepository, nil
}

func getConfigMessage(code string) Response {
	var msg = &Response{}
	messageRepo, err := GetMessageInstance()
	if err != nil {
		logger.Errorf("getConfigMessage(): err = %s", err.Error())
		msg.Code = "UNKNOWN_ERROR"
		msg.Description = "Unable to retrieve error message"
		msg.Status = "Internal Error"
	}
	//logger.Debug("getConfigMessage(): messageRepo = ", messageRepo)
	if *messageRepo.Messages[code] != nil {
		if err := JSONtoObject(*messageRepo.Messages[code], msg); err != nil {
			msg.Code = "UNKNOWN_ERROR"
			msg.Description = "Unable to retrieve error message"
			msg.Status = "Internal Error"
		}
	} else {
		msg.Code = "UNKNOWN_STATUS"
		msg.Description = "Unable to retrieve status message"
		msg.Status = "Internal Error"
	}
	return *msg
}

//GetMessage:
//in:
func GetMessage(code string) []byte {
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msgBytes, _ := ObjecttoJSON(msg)
	return msgBytes
}

//GetMessageErrorString:
//in:
func GetMessageErrorString(code string, err error) string {
	errorMsg := "NA"
	if err != nil {
		errorMsg = err.Error()
	}
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = errorMsg
	msgBytes, _ := ObjecttoJSON(msg)
	return string(msgBytes)
}

//GetMessageError:
//in:
func GetMessageError(code string, errorMsg string) ([]byte, error) {
	var msgBytes []byte
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = errorMsg
	msgBytes, _ = ObjecttoJSON(msg)
	return msgBytes, nil
}

//GetMessageObject:
//in:
func GetMessageObject(code string, detail string, object string) ([]byte, error) {
	var msgBytes []byte
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = detail
	msgBytes, _ = ObjecttoJSON(msg)
	return msgBytes, nil
}

//GetMessageDetail:
//in:
func GetMessageDetail(code string, detail string) ([]byte, error) {
	var msgBytes []byte
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = detail
	msgBytes, _ = ObjecttoJSON(msg)
	return msgBytes, nil
}

//GetMessageDetail:
//in:
func GetSuccessResponse(code string, res []byte) []byte {
	var msgBytes []byte
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = string(res)
	msgBytes, _ = ObjecttoJSON(msg)
	return msgBytes
}

//ConstructResponse:
//in:
func ConstructResponse(code string, detail string, objBytes []byte) Response {
	// var msgBytes []byte
	msg := getConfigMessage(code)
	msg.Function = getFunctionName()
	msg.Detail = detail
	if len(objBytes) == 0 {
		objBytes = []byte("")
	}
	msg.ObjectBytes = string(objBytes)
	//	msgBytes, _ = ObjecttoJSON(msg)
	logger.Infof("ConstructResponse(): Response = %+v\n", msg)
	return msg
}

func isEmptyValue(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.Array, reflect.Map, reflect.Slice, reflect.String:
		return v.Len() == 0
	case reflect.Bool:
		return !v.Bool()
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int() == 0
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return v.Uint() == 0
	case reflect.Float32, reflect.Float64:
		return v.Float() == 0
	case reflect.Interface, reflect.Ptr:
		return v.IsNil()
	case reflect.Complex64, reflect.Complex128:
		return v.Complex() == 0
	}
	return false
}
