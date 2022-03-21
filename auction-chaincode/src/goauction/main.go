package main

import (
	"cycoreutils"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
	"github.com/pkg/errors"
	logger "github.com/sirupsen/logrus"
)

// ProjectKickerChaincode example - simple Chaincode implementation
type ProjectKickerChaincode struct {
	tableMap map[string]int
	funcMap  map[string]InvokeFunc
}

type Response struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type Role struct {
	Role         string `json:"role"`
	FunctionName string `json:"functionName"`
}

/////////////////////////////////////////////////////
// Constant for All function name that will be called from invoke
/////////////////////////////////////////////////////
const (
	CREATE_USR                string = "CreateUser"
	TRANSFER_NFT              string = "TransferNft"
	CREATE_AUCTION_REQUEST    string = "InitAuction"
	OPEN_AUCTION              string = "OpenAuction"
	CLOSE_AUCTION             string = "CloseAuction"
	BUY_IT_NOW                string = "BuyItNow"
	GET_INIT_AUCTION_REQUESTS string = "GetInitAuctionRequests"
	GET_OPEN_AUCTION_REQUESTS string = "GetOpenAuctionRequests"
	GET_AUCTION_ITEMS_BY_USER string = "GetAuctionItemsByUser"
	POST_BID                  string = "PostBid"
	GET_BIDS_BY_AUCTION_ID    string = "GetBidsByAuctionID"
	GET_HIGHEST_BID           string = "GetHighestBid"
	GET_BID_BY_ID             string = "GetBidByID"
	// GET_ITEM_BY_ID            string = "GetItemByID"
	// GET_NFT_BY_ID           string = "GetNftByID"
	GET_AUCTION_BY_ID       string = "GetAuctionByID"
	GET_ITEM_HISTORY        string = "GetItemHistory"
	GET_USER_DETAILS        string = "GetUserDetails"
	GET_NFT_LIST_BY_USER    string = "GetNftListByUser"
	GET_NFT_LIST_BY_ITEM_ID string = "GetNftListByItemId"

	QItemObject string = "queryItemObject"
	RItemObject string = "recordItemObject"
	// UItemObject string = "updateItemObject"
	// DItemObject string = "deleteItemObject"
	// QItemObjectL       string = "queryItemObjectList"
	// QItemObjectHistory string = "queryItemObjectHistory"

	QNftObject string = "queryNftObject"
	// RNftObject        string = "recordNftObject"			// NFT object is internally created at the time of adding new item
	// UNftObject        string = "updateNftObject"			// NFT object cannot be updated. It can only be transfered or deleted
	DNftObject        string = "deleteNftObject"
	QNftObjectL       string = "queryNftObjectList"
	QNftObjectHistory string = "queryNftObjectHistory"
)

// var logger = shim.NewLogger("project-kicker-main")

type InvokeFunc func(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response

/////////////////////////////////////////////////////
// Map all the Functions here for Invoke
/////////////////////////////////////////////////////
func (t *ProjectKickerChaincode) initMaps() {
	t.tableMap = make(map[string]int)
	t.funcMap = make(map[string]InvokeFunc)

	t.funcMap[CREATE_USR] = createUser
	t.funcMap[TRANSFER_NFT] = transferNft
	t.funcMap[CREATE_AUCTION_REQUEST] = createAuctionRequest
	t.funcMap[OPEN_AUCTION] = openAuction
	t.funcMap[CLOSE_AUCTION] = closeAuction
	t.funcMap[BUY_IT_NOW] = buyItNow
	t.funcMap[GET_INIT_AUCTION_REQUESTS] = getListOfInitAucs
	t.funcMap[GET_OPEN_AUCTION_REQUESTS] = getListOfOpenAucs
	// t.funcMap[GET_AUCTION_ITEMS_BY_USER] = getAuctionItemsByUser
	t.funcMap[GET_NFT_LIST_BY_USER] = queryNftListByUser
	t.funcMap[GET_NFT_LIST_BY_ITEM_ID] = queryNftListByItemId
	t.funcMap[POST_BID] = postBid
	t.funcMap[GET_BIDS_BY_AUCTION_ID] = getBidsByAuctionID
	t.funcMap[GET_HIGHEST_BID] = getHighestBid
	t.funcMap[GET_BID_BY_ID] = getBidByID
	// t.funcMap[GET_ITEM_BY_ID] = getItemByID
	// t.funcMap[GET_NFT_BY_ID] = getNftByID
	t.funcMap[GET_AUCTION_BY_ID] = getAuctionByID
	// t.funcMap[GET_ITEM_HISTORY] = getItemHistory
	t.funcMap[GET_USER_DETAILS] = getUserDetails

	t.funcMap[QItemObject] = queryItemObject
	t.funcMap[RItemObject] = recordItemObject
	// t.funcMap[UItemObject] = updateItemObject
	// t.funcMap[DItemObject] = deleteItemObject
	// t.funcMap[QItemObjectL] = queryItemObjectList
	// t.funcMap[QItemObjectHistory] = queryItemObjectHistory

	t.funcMap[QNftObject] = queryNftObject
	// t.funcMap[RNftObject] = recordNftObject			// NFT object is internally created at the time of adding new item
	// t.funcMap[UNftObject] = updateNftObject
	t.funcMap[DNftObject] = deleteNftObject
	t.funcMap[QNftObjectL] = queryNftObjectList
	t.funcMap[QNftObjectHistory] = queryNftObjectHistory
}

//////////////////////////////////////////////////////////////////////////////////
// Initialize Chaincode at Deploy Time
//////////////////////////////////////////////////////////////////////////////////
func (t *ProjectKickerChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("########### Init ###########")
	t.initMaps()
	isInit = true
	logger.Info("ProjectKickerChaincode Init")
	return shim.Success((GetResponse("success", "Succesfully Initiated ProjectKickerChaincode")))
}

//////////////////////////////////////////////////////////////////////////////////
// Invoke Chaincode functions as requested by the Invoke Function
// In fabric 1.0 both Invoke and Query Requests are handled by Invoke
//////////////////////////////////////////////////////////////////////////////////
func (t *ProjectKickerChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	//Temporay fix  if the initialization not done on the specific peer do it before Invoke a method
	if !isInit {
		t.initMaps()
		isInit = true
	}

	var returnValue cycoreutils.Response
	function, args := stub.GetFunctionAndParameters()
	f, ok := t.funcMap[function]
	var access bool
	var err error
	if ok {
		// access, err = functionCheckAccess(stub, function)
		access = true

		if err != nil {
			logger.Errorf("Error in fetching access. For function Name:%s ", function)
			return shim.Error(string("{\"function\":function,\"error\":err}"))
		}
		if !access {
			logger.Errorf("Invalid access for function:%s", function)
			return shim.Error(string("{\"status\":\"ERROR\",\"function\":" + function + ",\"description\":\"Unauthorized\",\"detail\":\"Unauthorized\"}"))
		}
		logger.Infof("########### Invoke/Query ###########: %s", function)

		rargs, err := stub.GetTransient()
		if err != nil {
			logger.Infof("arg[0] is not transient: %s", err.Error())
		} else {
			targs, ok1 := rargs["pargs"]
			if ok1 {
				args[0] = string(targs[:])
				logger.Info("arg[0] is transient")
			} else {
				logger.Error("arg[0] transient but could not read properly")
			}
		}

		returnValue = f(stub, args)
		returnBytes, err := cycoreutils.ObjecttoJSON(returnValue)
		if err != nil {
			logger.Errorf("Error converting the Result to JSON bytes: %s", err.Error())
			logger.Debugf("Returned Value: %+v", returnValue)
			return shim.Error(string("{\"status\":\"ERROR\",\"description\":\"Unexpected end of action. Please retry!\",\"detail\":\"" +
				(errors.Wrap(err, "Error converting the Result to JSON bytes")).Error() + "\"}"))
		}

		if returnValue.Status != "SUCCESS" {
			logger.Errorf("%s Error returned from chaincode %s", function, string(returnBytes))
			return shim.Error(string(returnBytes))
		}

		return shim.Success(returnBytes)

	}
	logger.Errorf("Invalid function name %s", function)
	return shim.Error(fmt.Sprintf("Invalid function %s", function))
}

func functionCheckAccess(stub shim.ChaincodeStubInterface, functionName string) (bool, error) {
	logger.Infof("functionCheckAccess() Entry--> ")
	var err error
	role, ok, err := cid.GetAttributeValue(stub, "role")

	if err != nil {
		return false, err
	}

	if !ok {
		return false, err
	}

	keyRole := Role{Role: role, FunctionName: functionName}

	keys, err := RoleToJSON(keyRole)

	logger.Infof("Keys for functionCheckAccess : ", keys)

	f := "queryFunctionAccessCheck"

	invokeArgs := toChaincodeArgs(f, string(keys))

	response := stub.InvokeChaincode("role_manager", invokeArgs, "defaultchannel")
	logger.Info("response status 1", response.Status)
	if response.Status != 200 {
		return false, nil
	}
	access := string(response.Payload[:])
	logger.Infof("Access recevied from AccessChecker chaincode is: %s", access)

	return true, nil
}

func toChaincodeArgs(args ...string) [][]byte {
	bargs := make([][]byte, len(args))
	for i, arg := range args {
		bargs[i] = []byte(arg)
	}
	return bargs
}

var isInit = false

func main() {
	logger.Info("ProjectKickerChaincode: main(): Init ")
	err := shim.Start(new(ProjectKickerChaincode))
	if err != nil {
		logger.Errorf("ProjectKickerChaincode: main(): Error starting Simple Chaincode : %s", err)
	}
}

//Prepare the response
func GetResponse(status string, message string) []byte {
	res := Response{Status: status, Message: message}
	logger.Info("GetResponse: Called For: ", res)
	response, err := cycoreutils.ObjecttoJSON(res)
	if err != nil {
		logger.Errorf(fmt.Sprintf("Invalid function %s", err))
	}
	return response
}

func init() {
	logger.SetLevel(logger.DebugLevel)
}

// RoleToJSON : Converts Role Object to JSON
func RoleToJSON(role Role) ([]byte, error) {
	fmt.Println("RoleToJSON Init")
	rjson, err := json.Marshal(role)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	fmt.Println("Role Bytes : ", rjson)
	return rjson, nil
}
