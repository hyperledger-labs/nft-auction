#!/bin/bash
## author: surya.lanka@chainyard.com
which minifab
rc=$?
if [ $rc -ne 0 ];
then
    curl -o minifab -sL https://tinyurl.com/yxa2q6yr && chmod +x minifab
    sudo mv minifab /usr/local/bin/
fi

function networkUp() {
    CHAINCODE_PATH=vars/chaincode/auctionchaincode/go
    if [ ! -r "${CHAINCODE_PATH}" ];
    then
    mkdir -p vars/chaincode/auctionchaincode/go
    fi
    cp -r auction-chaincode/src/goauction/* vars/chaincode/auctionchaincode/go/
    echo "Bringing up fabric network using minifab"
    minifab up -s couchdb -i 2.2.3 -o org1.example.com -c defaultchannel -v 1 -n auctionchaincode -l go -r false -p ''
    NUM_PEER_CONTAINERS=$(docker ps -f status=running | grep peer | wc -l)
    if [ ${NUM_PEER_CONTAINERS} -ne 12 ]; then
        echo "Error in bringing up fabric network"
        exit 1
    fi
    NUM_ORDERER_CONTAINERS=$(docker ps -f status=running | grep orderer | wc -l)
    if [ ${NUM_ORDERER_CONTAINERS} -ne 1 ]; then
        echo "Error in bringing up fabric network"
        exit 1
    fi
}

function applicationUp() {
    docker build -t auction-restapi:latest ./auction-restapi/
    docker build -t auction-ui:latest ./auction-ui/
    echo "Creating connection profiles for the nft-auction application"
    ./network/local/ccp-generate.sh
    rc=$?
    if [ $rc -ne 0 ];
    then
        echo "Failed to create connection profiles"
        exit 1
    fi
    echo "Bringing up restapi and ui containers"
    docker-compose up -d
}

function cleanUp() {
    docker-compose down
    docker rmi -f auction-restapi:latest auction-ui:latest
    minifab cleanup -o org1.example.com
}

## Parse mode
if [[ $# -ne 1 ]] ; then
    echo "Invalid number of arguments"
    echo "Example usage for bringing up whole application: ./network-nft-auction.sh up"
    echo "Example usage for bringing down whole application: ./network-nft-auction.sh down"
    echo "Example usage for restarting whole application: ./network-nft-auction.sh restart"
    exit 1
else
    MODE=$1
    shift
fi

case "$MODE" in
    "up")
    networkUp
    sleep 30
    applicationUp
    ;;
    "down")
    cleanUp
    ;;
    "app-up")
    applicationUp
    ;;
    "app-down")
    docker-compose down
    docker rmi -f auction-restapi:latest auction-ui:latest
    ;;
    "restart")
    cleanUp
    sleep 5
    networkUp
    sleep 30
    applicationUp
    ;;
    *)
    echo "Mode ${MODE} passed is not a supported action"
    exit 1
    ;;
esac
