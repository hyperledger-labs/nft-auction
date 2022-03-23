#!/bin/bash -e
#
# SPDX-License-Identifier: Apache-2.0
#

CC_VERSION=$1
CC_SEQUENCE=$2
CHANNEL_NAME="defaultchannel"
CC_NAME="auctionchaincode"
CC_PATH="../../../auction-chaincode/src/goauction"

# package and install chaincode on org1 and org2 nodes
./network.sh deployCC -ccn $CC_NAME -ccv $CC_VERSION -ccs $CC_SEQUENCE -ccp $CC_PATH -ccl go -ccsd true

# upgrade chaincode
./network.sh deployCC -c $CHANNEL_NAME -ccn $CC_NAME  -ccv $CC_VERSION -ccs $CC_SEQUENCE -ccp $CC_PATH -ccl go -cci Init -ccsp true
