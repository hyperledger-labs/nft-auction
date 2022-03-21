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

// Create a Bid Object
// Once an Item has been opened for auction, bids can be submitted as long as the auction is "OPEN"
// ================================================================================
func postBid(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debugf("postBid :  args : %s", args)

	bid := &Bid{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), bid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arguments to a Bid object")).Error(), nil)
	}

	collectionName := ""
	// Reject the Bid if the Buyer Information Is not Valid or not registered on the Block Chain
	userBytes, err := cycoreutils.QueryObject(stub, USER, []string{bid.BuyerID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", (errors.Wrapf(err, "Failed to query User")).Error(), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("User does not exist"), nil)
	}

	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{bid.AuctionID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction Request does not exist"), nil)
	}

	AuctionRequest := AuctionRequest{}
	err = cycoreutils.JSONtoObject(auctionRequestBytes, &AuctionRequest)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object unmarshalling Failed")).Error(), nil)
	}

	if bid.BuyerID == AuctionRequest.SellerID {
		return cycoreutils.ConstructResponse("SASTQRY008E", fmt.Sprintf("Cannot accept Bid as item is already owned by you"), nil)
	}

	// Reject Bid if Auction is not "OPEN"
	if AuctionRequest.Status != OPEN {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Cannot accept Bid as Auction is not OPEN"), nil)
	}

	// Reject Bid if the time bid was received is > Auction Close Time
	if tCompare(bid.BidTime, AuctionRequest.CloseDate) == false {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Bid Time past the Auction Close Time"), nil)
	}

	// Set Bid NFT ID to Auction NFT ID
	bid.NftId = AuctionRequest.NftId

	// Reject Bid if Bid Price is less than Reserve Price
	// Convert Bid Price and Reserve Price to Float
	bidPrice, err := strconv.ParseFloat(bid.BidPrice, 64)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Bid Price is not a valid float value")).Error(), nil)
	}

	reservePrice, err := strconv.ParseFloat(AuctionRequest.ReservePrice, 64)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Reserve Price is not a valid float value")).Error(), nil)
	}

	// Check if Bid Price is > Auction Request Reserve Price
	if bidPrice < reservePrice {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Bid Price must be greater than Auction Item Reserve Price"), nil)
	}

	// Post or Accept the Bid
	bidBytes, err := cycoreutils.ObjecttoJSON(bid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Bid object unmarshalling failed")).Error(), nil)
	}

	err = cycoreutils.UpdateObject(stub, BID, []string{bid.BidID}, bidBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to create Bid")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("CYDOCUPD010I", fmt.Sprintf("Successfully Recorded the Bid"), bidBytes)
}

// getBidsByAuctionID - Get all the bids for an Auction Item
// ================================================================================
func getBidsByAuctionID(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Info("Arguments for getAuctionItemsByUser : %s", args[0])
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\",\"auctionID\":\"%s\"}}", BID, args[0])
	bidsList, err := getBidsList(stub, queryString)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", err.Error(), nil)
	}
	jsonRows, err := json.Marshal(bidsList)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", err.Error(), nil)
	}
	return cycoreutils.ConstructResponse("SASTQRY007S", "", jsonRows)
}

// getHighestBid - Get the Highest Bid for an Auction Request
// ================================================================================
func getHighestBid(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debugf("getHighestBid :  args : %s", args)

	highestBidPrice := float64(0.0)
	highestBid := Bid{}

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\",\"auctionID\":\"%s\"}}", BID, args[0])
	bidsList, err := getBidsList(stub, queryString)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", err.Error(), nil)
	}

	for _, currentBid := range bidsList {
		bidPrice, err := strconv.ParseFloat(currentBid.BidPrice, 64)
		if err != nil {
			return cycoreutils.ConstructResponse("SASTCONV002E", "Bid Price is not a valid float value.", nil)
		}

		if bidPrice >= highestBidPrice {
			highestBidPrice = bidPrice
			highestBid = currentBid
		}
	}
	if len(bidsList) == 0 {
		highestBid.DocType = ""
		highestBid.BidPrice = "0"
	}

	bidBytes, err := cycoreutils.ObjecttoJSON(highestBid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", "Bid object", nil)
	}
	return cycoreutils.ConstructResponse("SASTQRY007S", "", bidBytes)
}

//  buyItNow - Buyer has the option to buy the ITEM before the bids exceed BuyITNow Price .
// ================================================================================
func buyItNow(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debugf("buyItNow :  args : %s", args)

	currentBid := &Bid{}
	err := cycoreutils.JSONtoObject([]byte(args[0]), currentBid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert arguments to a Bid object")).Error(), nil)
	}

	currentBidPrice, err := strconv.ParseFloat(currentBid.BidPrice, 64)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Bid Price is not a valid float value")).Error(), nil)
	}

	collectionName := ""
	// Close The Auction -  Fetch Auction Request Object
	auctionRequestBytes, err := cycoreutils.QueryObject(stub, AUCREQ, []string{currentBid.AuctionID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query Auction Request")).Error(), nil)
	}
	if auctionRequestBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Auction Request does not exist"), nil)
	}

	// Check if Owner is a valid user
	userBytes, err := cycoreutils.QueryObject(stub, USER, []string{currentBid.BuyerID}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("CYUSRQRY003E", (errors.Wrapf(err, "Failed to query if Buyer exists")).Error(), nil)
	}
	if userBytes == nil {
		return cycoreutils.ConstructResponse("CYUSRDNE004E", fmt.Sprintf("Buyer does not exist"), nil)
	}

	AuctionRequest := AuctionRequest{}
	err = cycoreutils.JSONtoObject(auctionRequestBytes, &AuctionRequest)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "AuctionRequest object unmarshalling failed")).Error(), nil)
	}

	if AuctionRequest.Status == CLOSED {
		return cycoreutils.ConstructResponse("SASTUPD009E", fmt.Sprintf("Auction Request is already closed. BuyItNow is Rejected"), nil)
	}

	// Process Final Bid - Turn it into a Transaction
	response := getHighestBid(stub, []string{currentBid.AuctionID})
	if response.Status != "SUCCESS" {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Operation Failed")).Error(), nil)
	}

	highestBidBytes := []byte(response.ObjectBytes)
	highestBid := &Bid{}
	err = cycoreutils.JSONtoObject(highestBidBytes, highestBid)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Failed to convert Highest Bid to a Bid object")).Error(), nil)
	}

	highestBidPrice, err := strconv.ParseFloat(highestBid.BidPrice, 64)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Highest Bid Price is not a valid float value")).Error(), nil)
	}

	if highestBidPrice > currentBidPrice {
		return cycoreutils.ConstructResponse("SASTCONV002E", fmt.Sprintf("Highest Bid Price is greater than BuyItNow Price. BuyItNow is Rejected"), nil)
	}

	auctionBuyItNowPrice, err := strconv.ParseFloat(AuctionRequest.BuyItNowPrice, 64)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Buy it Now Price is not a valid float value")).Error(), nil)
	}

	if currentBidPrice < auctionBuyItNowPrice {
		return cycoreutils.ConstructResponse("SASTCONV002E", fmt.Sprintf("BuyItNow Price is less than Auction Request BuyItNow Price. BuyItNow is Rejected"), nil)
	}

	//  Update Auction Status
	AuctionRequest.Status = CLOSED
	auctionRequestBytes, err = cycoreutils.ObjecttoJSON(AuctionRequest) // Converting the auction request struct to []byte array
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Auction Request object marshalling failed")).Error(), nil)
	}

	// Update Auction Request
	err = cycoreutils.UpdateObject(stub, AUCREQ, []string{AuctionRequest.AuctionID}, auctionRequestBytes, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTUPD009E", (errors.Wrapf(err, "Failed to update Auction Request")).Error(), nil)
	}

	TransferNft := TransferNft{}
	TransferNft.NftId = AuctionRequest.NftId
	TransferNft.ItemImage = AuctionRequest.ItemImage
	TransferNft.OwnerAESKey = AuctionRequest.AESKey
	TransferNft.OwnerID = AuctionRequest.SellerID
	TransferNft.Transferee = currentBid.BuyerID
	TransferNft.ItemPrice = AuctionRequest.BuyItNowPrice

	// Convert TransferNft to JSON
	transferItemBytes, err := cycoreutils.ObjecttoJSON(TransferNft) // Converting the transfer item request struct to []byte array
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "TransferNft object marshalling failed")).Error(), nil)
	}

	err = stub.SetEvent("TRANSFER_ITEM", transferItemBytes)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTCONV002E", (errors.Wrapf(err, "Unable to set TransferNft event")).Error(), nil)
	}

	return cycoreutils.ConstructResponse("SASTUPD010S", fmt.Sprintf("Transfer has been successfully initiated!!!!"), nil)
}

// getBidByID - Get Bid Details by Bid ID
// ======================================================================================
func getBidByID(stub shim.ChaincodeStubInterface, args []string) cycoreutils.Response {
	logger.Debug("Arguments for getBidByID : %s", args[0])

	collectionName := ""

	// Get the Bid Information
	bidBytes, err := cycoreutils.QueryObject(stub, BID, []string{args[0]}, collectionName)
	if err != nil {
		return cycoreutils.ConstructResponse("SASTQRY003E", (errors.Wrapf(err, "Failed to query if Bid exists")).Error(), nil)
	}
	if bidBytes == nil {
		return cycoreutils.ConstructResponse("SASTDNE004E", fmt.Sprintf("Bid does not exist"), nil)
	}

	return cycoreutils.ConstructResponse("SASTQRY014S", "", bidBytes)
}

// helper functions

// tCompare - Time and Date Comparison
// tCompare("2016-06-28 18:40:57", "2016-06-27 18:45:39")
//////////////////////////////////////////////////////////
func tCompare(t1 string, t2 string) bool {

	layout := "2006-01-02 15:04:05"
	bidTime, err := time.Parse(layout, t1)
	if err != nil {
		logger.Error("tCompare() Failed : time Conversion error on t1")
		return false
	}

	auctionCloseTime, err := time.Parse(layout, t2)
	if err != nil {
		logger.Error("tCompare() Failed : time Conversion error on t2")
		return false
	}

	if bidTime.Before(auctionCloseTime) {
		return true
	}

	return false
}

// getBidsList - Executes the passed in query string and returns bids list.
// Result set is built and returned as a byte array containing the JSON results.
// ================================================================================
func getBidsList(stub shim.ChaincodeStubInterface, queryString string) ([]Bid, error) {
	logger.Debug("getBidsList() queryString: %s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var tlist []Bid // Define a list
	// Iterate through result set
	for i := 0; resultsIterator.HasNext(); i++ {
		// We can process whichever return value is of interest
		record, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf(err.Error())
		}
		ar := Bid{}
		err = cycoreutils.JSONtoObject(record.Value, &ar)
		if err != nil {
			errorMsg := fmt.Sprintf("getBidsList() operation failed - Unmarshall Error. %s", err)
			logger.Debug(errorMsg)
			return nil, fmt.Errorf(errorMsg)
		}
		logger.Debug("getBidsList() :  Value : ", ar)
		tlist = append(tlist, ar)
	}

	return tlist, nil
}
