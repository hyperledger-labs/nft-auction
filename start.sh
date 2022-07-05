curl -o minifab -sL https://tinyurl.com/yxa2q6yr && chmod +x minifab
sudo mv minifab /usr/local/bin/
#docker-compose down
#minifab cleanup
minifab netup -s couchdb -i 2.2.3 -o org1.example.com
minifab create -c defaultchannel -o org1.example.com
minifab join -c defaultchannel
minifab anchorupdate -c defaultchannel
sudo mkdir -p vars/chaincode/auctionchaincode/go
sudo cp -r auction-chaincode/src/goauction/* vars/chaincode/auctionchaincode/go/
minifab ccup -v 1 -n auctionchaincode -l go -r false -p ''
minifab profilegen -c defaultchannel
./network/local/ccp-generate.sh
docker build -t auction-restapi:latest ./auction-restapi/
docker build -t auction-ui:latest ./auction-ui/
docker-compose up -d
