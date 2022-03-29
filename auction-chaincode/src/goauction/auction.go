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
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/pkg/errors"
	logger "github.com/sirupsen/logrus"
)

// getListOfInitAucs - Get List of Auctions that have been initiated
// ======================================================================================
func getListOfInitAucs(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	jsonRows, err := getAuctionsListByStatus(stub, INIT)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}
	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("List of Init Auctions"), jsonRows)
}

// getListOfInitAucsByAH - Get List of Auctions that have been initiated against an Auction House
// ======================================================================================
func getListOfInitAucsByAH(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	jsonRows, err := getAuctionsListByStatusAndAH(stub, INIT, args[0])
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}
	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("List of Init Auctions for the current Auction House"), jsonRows)
}

// getListOfOpenAucs - Get List of Open Auctions for which bids can be supplied
// ======================================================================================
func getListOfOpenAucs(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	jsonRows, err := getAuctionsListByStatus(stub, OPEN)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}
	return cycoreutils.ConstructResponse("SASTQRY014S", fmt.Sprintf("List of Open Auctions"), jsonRows)
}

// getListOfOpenAucsByAH - Get List of Open Auctions against an Auction House
// ======================================================================================
func getListOfOpenAucsByAH(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	jsonRows, err := getAuctionsListByStatusAndAH(stub, OPEN, args[0])
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}
	return cycoreutils.ConstructResponse("SASTQRY014S", fmt.Sprintf("List of Open Auctions for the current Auction House"), jsonRows)
}

// verifyIfNftIsOnAuction - Checks if an NFT is already on Auction
// ======================================================================================
func verifyIfNftIsOnAuction(stub shim.ChaincodeStubInterface, nftId string) (bool, error) {
	queryString := fmt.Sprintf("{\"selector\":{\"docType\": \"%s\",\"$or\": [{ \"status\": \"%s\" },{ \"status\": \"%s\" }],\"nftId\": \"%s\"}}}", AUCREQ, OPEN, INIT, nftId)
	jsonRows, err := getAuctionsList(stub, queryString)
	if err != nil {
		return false, err
	}

	tlist := make([]AuctionRequest, len(jsonRows))
	err = json.Unmarshal([]byte(jsonRows), &tlist)
	if err != nil {
		return false, err
	}

	if len(tlist) > 0 {
		return true, nil
	}

	return false, nil
}

// createAuctionRequest - Create an Auction Request
// The owner of an NFT, when ready to put the item on an auction
// will create an auction request  and specify a auction house.
// ======================================================================================
func createAuctionRequest(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for createAuctionRequest : %s", args[0])

	AuctionRequest := &AuctionRequest{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), AuctionRequest)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Failed to convert arguments to a AuctionRequest object"), nil)
	}

	collectionName := ""

	// Check if Auction Request already exists
	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{AuctionRequest.AuctionID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Auction Request already exists"), nil)
	}

	// Check if Auction NFT exists
	NftBytes, err := cycoreutils.QueryObject(stub, NFT, []string{AuctionRequest.NftId}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query if Auction NFT exists")).Error(), nil)
	}
	if NftBytes == nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", fmt.Sprintf("Auction NFT does not exist"), nil)
	}

	NftObject := &nftobject{}
	err = cycoreutils.JSONtoObject(NftBytes, NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Request object unmarshalling failed")).Error(), nil)
	}

	NftObject.NftStatus = READYFORAUC

	// Check if Item exists
	Avalbytes, err := cycoreutils.QueryObject(stub, ARTINV, []string{NftObject.ItemID}, collectionName)
	if err != nil {
		cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Item object")).Error(), nil)
	}
	if Avalbytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Item not found"), nil)
	}

	Item := &itemobject{}
	err = cycoreutils.JSONtoObject(Avalbytes, Item)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Request object unmarshalling failed")).Error(), nil)
	}

	AuctionRequest.ItemImage = NftObject.ItemImage
	AuctionRequest.ItemImageName = Item.ItemImageName
	// Check if nft is already on auction
	isNftOnAuction, err := verifyIfNftIsOnAuction(stub, AuctionRequest.NftId)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to check if NFT is on Auction")).Error(), nil)
	}
	if isNftOnAuction {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Auction Request already exists for the NFT"), nil)
	}

	// Check if Seller is a valid user
	userBytes, err := cycoreutils.QueryObject(stub, USER, []string{AuctionRequest.SellerID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query if Seller exists")).Error(), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("Seller does not exist"), nil)
	}

	// Check if Auction House user is a valid user.
	userBytes, err = cycoreutils.QueryObject(stub, USER, []string{AuctionRequest.AuctionHouseID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query if Auction House exists")).Error(), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction House does not exist"), nil)
	}

	// TODO - Add validation to check if the Auction House user is of type Auction House(AH)

	// Check if item ownership is valid.
	err = validateNFTOwnership(stub, AuctionRequest.NftId, AuctionRequest.SellerID, AuctionRequest.AESKey)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}

	// Convert AuctionRequest to JSON
	auctionRequestBytes, err = cycoreutils.ObjecttoJSON(AuctionRequest) // Converting the auction request struct to []byte array
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Request object marshalling failed")).Error(), nil)
	}

	// Update the ledger with the Acution Request Data
	err = cycoreutils.UpdateObject(stub, AUCREQ, []string{AuctionRequest.AuctionID}, auctionRequestBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to create AuctionRequest")).Error(), nil)
	}

	NftBytes, err = cycoreutils.ObjecttoJSON(NftObject)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction NFT object marshalling failed")).Error(), nil)
	}
	err = cycoreutils.UpdateObject(stub, NFT, []string{NftObject.NftId}, NftBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Unable to update Auction NFT Status as 'Ready for Auction")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("Successfully created auction request"), auctionRequestBytes)
}

// openAuction - Open an Auction for Bids
// ======================================================================================
func openAuction(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for openAuction : %s", args[0])

	openAuctionRequest := &OpenAuctionRequest{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), openAuctionRequest)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arguments to a OpenAuctionRequest object")).Error(), nil)
	}

	collectionName := ""

	// Check if Auction Request exists
	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{openAuctionRequest.AuctionRequestID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction Request does not exist"), nil)
	}

	AuctionRequest := AuctionRequest{}
	err = cycoreutils.JSONtoObject(auctionRequestBytes, &AuctionRequest)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object unmarshalling failed")).Error(), nil)
	}

	// Check if Auction is already closed
	if AuctionRequest.Status == CLOSED {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Auction is already Closed. Cannot Open for new bids"), nil)
	}

	// Update Auction Duration
	auctionDuration, err := strconv.Atoi(openAuctionRequest.Duration)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Duration should be an integer value!")).Error(), nil)
	}

	auctionStartDate, err := time.Parse("2006-01-02 15:04:05", openAuctionRequest.AuctionStartDateTime)
	auctionEndDate := auctionStartDate.Add(time.Duration(auctionDuration) * time.Minute)

	//  Update Auction Object
	AuctionRequest.OpenDate = auctionStartDate.Format("2006-01-02 15:04:05")
	AuctionRequest.CloseDate = auctionEndDate.Format("2006-01-02 15:04:05")
	AuctionRequest.Status = OPEN

	// Convert AuctionRequest to JSON
	auctionRequestBytes, err = cycoreutils.ObjecttoJSON(AuctionRequest) // Converting the auction request struct to []byte array
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object marshalling failed")).Error(), nil)
	}

	// Update Auction Request
	err = cycoreutils.UpdateObject(stub, AUCREQ, []string{AuctionRequest.AuctionID}, auctionRequestBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to open Auction for Bids")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTREC011S", fmt.Sprintf("Succesfully opened Auction for Bids"), nil)
}

// getAuctionByID - Get Auction Details By ID
// ======================================================================================
func getAuctionByID(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for getAuctionByID : %s", args[0])

	collectionName := ""
	// Check if Auction Request exists
	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{args[0]}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction Request does not exist"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY005S", fmt.Sprintf("Successfully fetched auction request by id"), auctionRequestBytes)
}

// closeAuction - Closes the Auction
// ================================================================================
func closeAuction(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for closeAuction : %s", args[0])

	closeAuctionRequest := &AuctionRequest{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), closeAuctionRequest)

	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Failed to convert arguments to a AuctionRequest object"), nil)
	}

	collectionName := ""

	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{closeAuctionRequest.AuctionID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction Request does not exist"), nil)
	}

	AuctionRequest := AuctionRequest{}
	err = cycoreutils.JSONtoObject(auctionRequestBytes, &AuctionRequest)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object unmarshalling Failed")).Error(), nil)
	}

	// Check if Auction is already closed
	if AuctionRequest.Status == CLOSED {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Auction Request is already Closed"), nil)
	}

	//  Update Auction Status
	AuctionRequest.Status = CLOSED
	// Convert AuctionRequest to JSON
	auctionRequestBytes, err = cycoreutils.ObjecttoJSON(AuctionRequest) // Converting the auction request struct to []byte array
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object marshalling failed")).Error(), nil)
	}

	// Update Auction Request
	err = cycoreutils.UpdateObject(stub, AUCREQ, []string{AuctionRequest.AuctionID}, auctionRequestBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to close Auction Request")).Error(), nil)
	}

	response := getHighestBid(stub, []string{AuctionRequest.AuctionID})
	if response.Status != "SUCCESS" {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}

	highestBidBytes := []byte(response.ObjectBytes)
	highestBid := &Bid{}

	err = cycoreutils.JSONtoObject(highestBidBytes, highestBid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert Highest Bid to a Bid object")).Error(), nil)
	}
	if highestBid.DocType != "" {
		TransferNft := TransferNft{}
		TransferNft.NftId = AuctionRequest.NftId
		TransferNft.ItemImage = AuctionRequest.ItemImage
		TransferNft.OwnerAESKey = AuctionRequest.AESKey
		TransferNft.OwnerID = AuctionRequest.SellerID
		TransferNft.Transferee = highestBid.BuyerID
		TransferNft.ItemPrice = highestBid.BidPrice
		// Convert TransferNft to JSON
		transferItemBytes, err := cycoreutils.ObjecttoJSON(TransferNft) // Converting the transfer item request struct to []byte array
		if err != nil {
			return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "TransferNft object unmarshalling failed")).Error(), nil)
		}

		err = stub.SetEvent("TRANSFER_ITEM", transferItemBytes)
		if err != nil {
			return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Unable to set Transfer NFT event")).Error(), nil)
		}

		return cycoreutils.ConstructResponse("CYDOCUPD010I", fmt.Sprintf("Auction is closed successfully !!!. Transfer NFT intitated"), nil)
	}
	err = returnNftToOwner(stub, AuctionRequest.NftId)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to return the unsold NFT to it's owner")).Error(), nil)
	}
	return cycoreutils.ConstructResponse("CYDOCUPD010I", fmt.Sprintf("Auction is closed successfully !!!."), nil)
}

// helper functions

// getAuctionsList - Executes the passed in query string and returns auctions list.
// Result set is built and returned as a byte array containing the JSON results.
// ================================================================================
func getAuctionsList(stub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {
	logger.Debug("getAuctionsList() queryString: %s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var tlist []AuctionRequest // Define a list
	// Iterate through result set
	for i := 0; resultsIterator.HasNext(); i++ {
		// We can process whichever return value is of interest
		record, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf(err.Error())
		}
		ar := AuctionRequest{}
		err = cycoreutils.JSONtoObject(record.Value, &ar)
		if err != nil {
			errorMsg := fmt.Sprintf("getAuctionsList() operation failed - Unmarshall Error. %s", err)
			logger.Debug(errorMsg)
			return nil, fmt.Errorf(errorMsg)
		}
		logger.Debug("getAuctionsList() :  Value : ", ar)
		ar.ItemImage = ""
		tlist = append(tlist, ar)
	}

	jsonRows, err := json.Marshal(tlist)
	if err != nil {
		errorMsg := fmt.Sprintf("getAuctionsList() operation failed - Unmarshall Error. %s", err)
		logger.Debug(errorMsg)
		return nil, fmt.Errorf(errorMsg)
	}
	return jsonRows, nil
}

func getAuctionsListByStatus(stub shim.ChaincodeStubInterface, status string) ([]byte, error) {
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\",\"status\":\"%s\"}}", AUCREQ, status)

	queryResults, err := getAuctionsList(stub, queryString)
	if err != nil {
		return nil, err
	}
	logger.Debug(queryResults)
	return queryResults, nil
}

func getAuctionsListByStatusAndAH(stub shim.ChaincodeStubInterface, status string, auctionHouseID string) ([]byte, error) {
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\",\"status\":\"%s\",\"auctionHouseID\":\"%s\"}}", AUCREQ, status, auctionHouseID)

	queryResults, err := getAuctionsList(stub, queryString)
	if err != nil {
		return nil, err
	}
	logger.Debug(queryResults)
	return queryResults, nil
}

// returnNftToOwner returns the NFT back to it's owner when it is unsold in the auction
func returnNftToOwner(stub shim.ChaincodeStubInterface, nftId string) error {
	collectionName := ""

	nft, err := getNftObject(stub, nftId)
	if err != nil {
		return err
	}

	// reset the status of the token
	nft.NftStatus = INITIAL

	NftObjectBytes, _ := cycoreutils.ObjecttoJSON(nft)
	err = cycoreutils.UpdateObject(stub, NFT, []string{nftId}, NftObjectBytes, collectionName)
	if err != nil {
		return fmt.Errorf("Unable to update Auction NFT Status")
	}
	return nil
}
