package main

import (
	"cycoreutils"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/pkg/errors"
	logger "github.com/sirupsen/logrus"
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Record NFT to the ledger. This is equivalent to Mint
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func recordNftObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	var err error
	var collectionName string
	var Avalbytes []byte
	var NftObject = &nftobject{}

	// Convert the arg to a recordNftObject object
	logger.Info("recordNftObject() : Arguments for recordNftObject : ", args[0])
	err = cycoreutils.JSONtoObject([]byte(args[0]), NftObject)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Failed to convert arguments to a NFT object"), nil)
	}

	// Query and Retrieve the NFT
	keys := []string{NftObject.NftId}
	logger.Debug("Keys for NFT %s: ", keys)

	collectionName = ""

	Avalbytes, err = cycoreutils.QueryObject(stub, NftObject.DocType, keys, collectionName)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query NFT object")).Error(), nil)
	}

	if Avalbytes != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("NFT already exists"), nil)
	}

	// initialize the status of NFT
	NftObject.NftStatus = INITIAL

	NftObjectBytes, _ := cycoreutils.ObjecttoJSON(NftObject)
	err = cycoreutils.UpdateObject(stub, NftObject.DocType, keys, NftObjectBytes, collectionName)

	if err != nil {
		logger.Errorf("recordNftObject() : Error inserting NFT object into LedgerState %s", err)
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "NFT object update failed")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("Successfully Recorded NFT object"), NftObjectBytes)
}

// transferNft - Transfer NFT to new owner - no change in price
// ================================================================================
func transferNft(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debug("Arguments for transferNft : %s", args[0])

	TransferNft := &TransferNft{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), TransferNft)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arguments to a TransferNft object")).Error(), nil)
	}

	collectionName := ""

	// Check if NFT exists
	NftBytes, err := cycoreutils.QueryObject(stub, NFT, []string{TransferNft.NftId}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query if NFT exists")).Error(), nil)
	}
	if NftBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("NFT does not exist"), nil)
	}

	// Check if NFT is already on Auction
	isNftOnAuction, err := verifyIfNftIsOnAuction(stub, TransferNft.NftId)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", fmt.Sprintf("Failed to check if NFT is on Auction"), nil)
	}
	if isNftOnAuction {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("NFT is either initiated or opened for Auction"), nil)
	}

	// Check if Owner is a valid user
	userBytes, err := cycoreutils.QueryObject(stub, USER, []string{TransferNft.OwnerID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", fmt.Sprintf("Failed to query if Seller exists"), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("Seller does not exist"), nil)
	}

	// Check if Transferee is a valid user
	userBytes, err = cycoreutils.QueryObject(stub, USER, []string{TransferNft.Transferee}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", fmt.Sprintf("Failed to query if Transferee User exists"), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("Transferee User does not exist"), nil)
	}

	// prevent self transfer
	if TransferNft.OwnerID == TransferNft.Transferee {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("NFT cannot be Transferred. You are the already owner of the NFT"), nil)
	}

	// Check if nft ownership is valid.
	err = validateNFTOwnership(stub, TransferNft.NftId, TransferNft.OwnerID, TransferNft.OwnerAESKey)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", err.Error(), nil)
	}

	NftObject := &nftobject{}
	err = cycoreutils.JSONtoObject(NftBytes, NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", fmt.Sprintf("NFT object unmarshalling failed"), nil)
	}

	NftObject.NftStatus = INITIAL
	NftObject.AESKey = TransferNft.TransfereeAESKey
	NftObject.ItemImage = TransferNft.ItemImage
	NftObject.Owner = TransferNft.Transferee

	if TransferNft.ItemPrice != "" {
		NftObject.Price = TransferNft.ItemPrice
	}
	NftBytes, err = cycoreutils.ObjecttoJSON(NftObject)
	err = cycoreutils.UpdateObject(stub, NFT, []string{NftObject.NftId}, NftBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Unable to transfer NFT"), nil)
	}

	return cycoreutils.ConstructResponse("SASTUPD010S", fmt.Sprintf("Successfully transferred Nft"), NftBytes)
}

//////////////////////////////////////////////////////////////
/// Query Nft Info from the ledger
//////////////////////////////////////////////////////////////
func queryNftObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var err error
	var Avalbytes []byte
	var collectionName string
	var NftObject = &nftobject{}

	// In future , it should be > 1 and ,= mo_of_keys for object
	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting NFT ID}. Received %d arguments", len(args)), nil)
	}

	NftObject.DocType = "NFT"

	err = cycoreutils.JSONtoObject([]byte(args[0]), NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrap(err, "Failed to convert arg[0] to NftObject object")).Error(), nil)
	}

	// Query and Retrieve the Full NftObject
	keys := []string{NftObject.NftId}
	logger.Info("Keys for NFT : ", keys)

	collectionName = ""

	Avalbytes, err = cycoreutils.QueryObject(stub, NftObject.DocType, keys, collectionName)

	if err != nil {
		cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query NFT object")).Error(), nil)
	}

	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("NFT not found"), nil)
	}

	err = cycoreutils.JSONtoObject(Avalbytes, NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert query result to NFT object")).Error(), nil)
	}

	logger.Info("queryNftObject() : Returning NFT results")

	return cycoreutils.ConstructResponse("SASTQRY005S", fmt.Sprintf("Successfully Queried NFT object"), Avalbytes)
}

//////////////////////////////////////////////////////////////
/// Query List of Nfts by ItemID from the ledger
//////////////////////////////////////////////////////////////
func queryNftListByItemId(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var collectionName string
	collectionName = ""

	logger.Info("Arguments for queryNftListByUser : %s", args[0])

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"NFT\",\"itemID\": \"%s\"}}", args[0])
	logger.Info("Query List: queryString: ", queryString)

	queryResults, err := cycoreutils.GetQueryResultForQueryString(stub, queryString, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY006E", (errors.Wrapf(err, "Failed to query NFT object list")).Error(), nil)
	}

	if queryResults == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("No Nfts found"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY007S", fmt.Sprintf("Successfully Retrieved the list of NFT objects "), queryResults)
}

//////////////////////////////////////////////////////////////
/// Query list of Nfts owned by a user from the ledger
//////////////////////////////////////////////////////////////
func queryNftListByUser(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	collectionName := ""
	logger.Info("Arguments for queryNftListByUser : %s", args[0])

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"NFT\",\"owner\": \"%s\"}}", args[0])
	logger.Info("Query List: queryString: ", queryString)

	queryResults, err := cycoreutils.GetQueryResultForQueryString(stub, queryString, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY006E", (errors.Wrapf(err, "Failed to query NFT object list")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY007S", fmt.Sprintf("Successfully Retrieved the list of NFT objects "), queryResults)
}

//////////////////////////////////////////////////////////////
/// Query NFT History from the ledger
//////////////////////////////////////////////////////////////
func queryNftObjectHistory(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	var err error
	var Avalbytes []byte
	var NftObject = &nftobject{}

	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting NFT ID}. Received %d arguments", len(args)), nil)
	}

	err = cycoreutils.JSONtoObject([]byte(args[0]), NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to NFT object")).Error(), nil)
	}

	// Query and Retrieve the Full NFT
	keys := []string{NftObject.NftId}
	logger.Info("Keys for NFT : ", keys)

	Avalbytes, err = cycoreutils.GetObjectHistory(stub, "NFT", keys)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query NFT object history")).Error(), nil)
	}
	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("NFT object not found"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY014S", fmt.Sprintf("Successfully Queried NFT object History"), Avalbytes)
}

// This is a helper function
// validateNFTOwnership - Validates The Ownership of an Asset using
// NFT ID, Owner ID, and AES Key
// ======================================================================================
func validateNFTOwnership(stub shim.ChaincodeStubInterface, nftId string, ownerID string, AESKey string) error {
	collectionName := ""

	// query the NFT object by NftId
	NftBytes, err := cycoreutils.QueryObject(stub, NFT, []string{nftId}, collectionName)
	if err != nil {
		return fmt.Errorf("Failed to query if NFT exists")
	}
	if NftBytes == nil {
		return fmt.Errorf("NFT does not exist")
	}

	// unmarshal the NFT object if it exists
	NftObject := &nftobject{}
	err = cycoreutils.JSONtoObject(NftBytes, NftObject)
	if err != nil {
		return fmt.Errorf("Failed to unmarshal NFT object")
	}

	// ***** Note: un-comment these logs only during debugging *****
	// logger.Debug("NFT Secret Key is : " + string(NftObject.AESKey))
	// logger.Debug("Supplied Secret Key is : " + string(AESKey))

	// TODO - consider removing AES key validation
	if NftObject.AESKey != AESKey {
		return fmt.Errorf("Failed validating item ownership. NFT AES Key does not match supplied AES Key")
	}

	logger.Debug("NFT Owner ID : " + string(NftObject.Owner))
	logger.Debug("Supplied Owner ID is : " + string(ownerID))

	if NftObject.Owner != ownerID {
		return fmt.Errorf("Failed validating item ownership. NFT Owner ID does not match supplied Seller ID")
	}
	return nil
}

// *************************************************************************************************************//
// Note: The methods below are not used as of now, but can be used to extend the functionality of the application
// *************************************************************************************************************//

//////////////////////////////////////////////////////////////
/// Query All NFTs from the ledger
//////////////////////////////////////////////////////////////
func queryNftObjectList(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var collectionName string
	collectionName = ""

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"NFT\"}}")
	logger.Info("Query List: queryString: ", queryString)

	queryResults, err := cycoreutils.GetQueryResultForQueryString(stub, queryString, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY006E", (errors.Wrapf(err, "Failed to query NFT object list")).Error(), nil)
	}

	if queryResults == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("No Nfts found"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY007S", fmt.Sprintf("Successfully Retrieved the list of NFT objects "), queryResults)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Delete NFT from the ledger.
////////////////////////////////////////////////////////////////////////////////////////////////////////////
func deleteNftObject(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {

	var err error
	DocType := "NFT"
	var collectionName string
	var NftObject = &nftobject{}

	collectionName = ""

	if len(args) != 1 {
		return cycoreutils.ConstructResponse("SUSRPARM001E", fmt.Sprintf("Expecting NFT ID}. Received %d arguments", len(args)), nil)
	}
	// Convert the arg to a deleteNftObject object
	logger.Info("deleteNftObject() : Arguments for Query: NFT : ", args[0])
	err = cycoreutils.JSONtoObject([]byte(args[0]), NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arg[0] to NFT object")).Error(), nil)
	}

	// Query and Retrieve the Full deleteNftObject
	keys := []string{NftObject.NftId}
	logger.Info("Keys for NFT : ", keys)

	err = cycoreutils.DeleteObject(stub, DocType, keys, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTDEL012E", (errors.Wrapf(err, "Failed to delete NFT object")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTDEL013I", fmt.Sprintf("Successfully Deleted NFT object"), nil)
}
