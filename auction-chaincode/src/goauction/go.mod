module main

go 1.16

require (
	cycoreutils v0.0.0-00010101000000-000000000000
	github.com/hyperledger/fabric-chaincode-go v0.0.0-20220131132609-1476cf1d3206
	github.com/hyperledger/fabric-protos-go v0.0.0-20220202165055-956c75de7b17
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.8.1
)

replace cycoreutils => ./cy-vendor/cycoreutils
