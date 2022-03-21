package main

import (
	"crypto/sha256"
	"cycoreutils"
	"encoding/hex"
	"fmt"
	"strings"

	"strconv"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/pkg/errors"
	logger "github.com/sirupsen/logrus"
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Record ItemObject to the ledger
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func recordItemObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	var err error
	var collectionName string
	var Avalbytes []byte
	var ItemObject = &itemobject{}
	var NftObject = &nftobject{}

	// Convert the arg to a recordItemObject object
	logger.Info("recordItemObject() : Arguments for recordItemObject : ", args[0])
	err = cycoreutils.JSONtoObject([]byte(args[0]), ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to ItemObject object")).Error(), nil)
	}

	// Convert the arg to a nft object
	err = cycoreutils.JSONtoObject([]byte(args[1]), NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[1] to NFT object")).Error(), nil)
	}

	ItemObject.DocType = "ARTINV"

	// default number of nfts to be minted based on this item if not provided in the parameter
	if ItemObject.NumberOfCopies == "" {
		ItemObject.NumberOfCopies = "1"
	}
	// Query and Retrieve the Full recordItemObject
	keys := []string{ItemObject.ItemID}
	logger.Debug("Keys for ItemObject %s: ", keys)

	collectionName = ""

	Avalbytes, err = cycoreutils.QueryObject(stub, ItemObject.DocType, keys, collectionName)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Item object")).Error(), nil)
	}

	if Avalbytes != nil {
		return cycoreutils.ConstructResponse("CYASTAE008E", fmt.Sprintf("Item already exists"), nil)
	}

	ItemObjectBytes, _ := cycoreutils.ObjecttoJSON(ItemObject)

	err = cycoreutils.UpdateObject(stub, ItemObject.DocType, keys, ItemObjectBytes, collectionName)

	if err != nil {
		logger.Errorf("recordItemObject() : Error inserting ItemObject object into LedgerState %s", err)
		return cycoreutils.ConstructResponse("CYASTUPD006E", (errors.Wrapf(err, "Item object update failed")).Error(), nil)
	}

	// Create unique NFT objects based on the number of copies to be made.
	// Each item object could have one or more NFTs associated with it
	copies, _ := strconv.Atoi(ItemObject.NumberOfCopies)
	for i := 1; i <= copies; i++ {
		NftObject.ItemCpyNum = strconv.Itoa(i)
		NftObject.NftId = createNftId(NftObject.ItemCpyNum, ItemObject.ItemID)

		NftObjectBytes, _ := cycoreutils.ObjecttoJSON(NftObject)
		bargs := make([]string, 1)
		bargs[0] = string(NftObjectBytes)

		// Mint NFTs
		recordNftObject(stub, bargs)
	}

	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("Successfully Recorded Item object"), ItemObjectBytes)
}

//////////////////////////////////////////////////////////////
/// Query ItemObject Info from the ledger
//////////////////////////////////////////////////////////////
func queryItemObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var err error
	var Avalbytes []byte
	var collectionName string
	var ItemObject = &itemobject{}

	// In future , it should be > 1 and ,= mo_of_keys for object
	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting ItemObject ID}. Received %d arguments", len(args)), nil)
	}

	ItemObject.DocType = "ARTINV"

	err = cycoreutils.JSONtoObject([]byte(args[0]), ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrap(err, "Failed to convert arg[0] to ItemObject object")).Error(), nil)
	}

	// Query and Retrieve the Full ItemObject
	keys := []string{ItemObject.ItemID}
	logger.Info("Keys for ItemObject : ", keys)

	collectionName = ""

	Avalbytes, err = cycoreutils.QueryObject(stub, ItemObject.DocType, keys, collectionName)

	if err != nil {
		cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Item object")).Error(), nil)
	}

	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Item not found"), nil)
	}

	err = cycoreutils.JSONtoObject(Avalbytes, ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert query result to Item object")).Error(), nil)
	}

	logger.Info("queryItemObject() : Returning ItemObject results")

	return cycoreutils.ConstructResponse("SASTQRY005S", fmt.Sprintf("Successfully Queried ItemObject object"), Avalbytes)
}

//////////////////////////////////////////////////////////////
/// Query ItemObject List from the ledger
//////////////////////////////////////////////////////////////
func queryItemObjectList(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var collectionName string
	collectionName = ""

	queryString := fmt.Sprintf("{\"selector\":{\"objectType\":\"ItemObject\"}}")
	logger.Info("Query List: queryString: ", queryString)

	queryResults, err := cycoreutils.GetQueryResultForQueryString(stub, queryString, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY006E", (errors.Wrapf(err, "Failed to query ItemObject object list")).Error(), nil)
	}

	if queryResults == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("No ItemObject record found"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY007S", fmt.Sprintf("Successfully Retrieved the list of ItemObject objects "), queryResults)
}

func createNftId(itemCpyNum, itemID string) string {
	s := []string{itemCpyNum, itemID}
	h := sha256.New()
	h.Write([]byte(strings.Join(s, "")))
	hash_hex := hex.EncodeToString(h.Sum(nil))
	nftId := hash_hex[len(hash_hex)-20:]

	return nftId
}

// *************************************************************************************************************//
// Note: The methods below are not used as of now, but can be used to extend the functionality of the application
// *************************************************************************************************************//

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Delete ItemObject from the ledger.
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func deleteItemObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var err error
	DocType := "ItemObject"
	var collectionName string
	var ItemObject = &itemobject{}

	collectionName = ""

	// In future , it should be > 1 and ,= mo_of_keys for object
	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting ItemObject ID}. Received %d arguments", len(args)), nil)
	}
	// Convert the arg to a deleteItemObject object
	logger.Info("deleteItemObject() : Arguments for Query: ItemObject : ", args[0])
	err = cycoreutils.JSONtoObject([]byte(args[0]), ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to ItemObject object")).Error(), nil)
	}

	// Query and Retrieve the Full deleteItemObject
	keys := []string{ItemObject.ItemID}
	logger.Info("Keys for ItemObject : ", keys)

	err = cycoreutils.DeleteObject(stub, DocType, keys, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTDEL012E", (errors.Wrapf(err, "Failed to delete ItemObject object")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTDEL013I", fmt.Sprintf("Successfully Deleted ItemObject object"), nil)
}

//////////////////////////////////////////////////////////////
/// Query ItemObject History from the ledger
//////////////////////////////////////////////////////////////
func queryItemObjectHistory(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	var err error
	var Avalbytes []byte
	var ItemObject = &itemobject{}

	// In future , it should be > 1 and ,= mo_of_keys for object
	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting ItemObject ID}. Received %d arguments", len(args)), nil)
	}

	err = cycoreutils.JSONtoObject([]byte(args[0]), ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to ItemObject object")).Error(), nil)
	}

	// Query and Retrieve the Full ItemObject
	keys := []string{ItemObject.ItemID}
	logger.Info("Keys for ItemObject : ", keys)

	Avalbytes, err = cycoreutils.GetObjectHistory(stub, "ItemObject", keys)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query ItemObject object history")).Error(), nil)
	}
	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("ItemObject object not found"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY014S", fmt.Sprintf("Successfully Queried ItemObject object History"), Avalbytes)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Update ItemObject to the ledger by getting a copy of it, updating that copy, and overwriting the original to a newer version
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func updateItemObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	var err error
	var Avalbytes []byte
	var collectionName string

	var ItemObject = &itemobject{}
	// Convert the arg to a updateItemObject object
	logger.Info("updateItemObject() : Arguments for Query: ItemObject : ", args[0])
	err = cycoreutils.JSONtoObject([]byte(args[0]), ItemObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to ItemObject object")).Error(), nil)
	}
	ItemObject.DocType = "ItemObject"
	// Query and Retrieve the Full updateItemObject
	keys := []string{ItemObject.ItemID}
	logger.Info("Keys for ItemObject : ", keys)

	collectionName = ""

	Avalbytes, err = cycoreutils.QueryObject(stub, ItemObject.DocType, keys, collectionName)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query ItemObject object")).Error(), nil)
	}

	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("ItemObject does not exist to update"), nil)
	}

	ItemObjectBytes, _ := cycoreutils.ObjecttoJSON(ItemObject)

	err = cycoreutils.UpdateObject(stub, ItemObject.DocType, keys, ItemObjectBytes, collectionName)

	if err != nil {
		logger.Errorf("updateItemObject() : Error updating ItemObject object into LedgerState %s", err)
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "ItemObject object update failed")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTUPD010S", fmt.Sprintf("Successfully Updated ItemObject object"), ItemObjectBytes)
}
