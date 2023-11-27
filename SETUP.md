# Prerequisites

To successfully run the application, you will need several dependencies installed on your machine. We will show the commands to install these dependencies for Ubuntu 20.04. The commands for other OS should be available in the corresponding application documentations.

If not already installed, you will need to install Node.js, Go, make, curl, jq, Git, Docker, and Docker-Compose on your Ubuntu system. 
Use the steps in each section below to properly install them.

## Install Git
For ubuntu:
```
sudo apt install git-all
```

## Install Docker
For ubuntu:
```
sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get install docker-ce docker-ce-cli containerd.io -y
```
### Add user account to the docker group
```
sudo groupadd docker
sudo usermod -aG docker $(whoami)
groups $USER
sudo apt-get update -y
```
Please follow the documentation given below to make sure you have Docker and you have it set up in correct way:
https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html#docker-and-docker-compose

For more details and troubleshooting, please refer to
https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html#
 
## Install Docker Compose
For Ubuntu:
```
sudo apt-get install docker-compose -y
```
**Troubleshooting note**: If you have permission issue to run docker, run `newgrp docker` and retry.

## Install Make
For Ubuntu:
```
sudo apt-get install build-essential
```

## Install jq
For Ubuntu:
```
sudo apt-get install jq -y
```

## Install curl
For Ubuntu:
```
sudo apt-get install curl -y
```

# Starting the application
After the prerequisites are installed, follow the below instructions to start the application on local machine.

1. Download or Clone the code repo.

2. Open a terminal from the root directory of the code repo and run the blockchain network and application using the following commands: 
    ```
    ./network-nft-auction.sh up
    ``` 
    The script will stand up a simple Fabric network, node application (restapi container) and front-end application (ui container). The network has two peer organizations with two peer each and a single node raft ordering service.

    The node application should now be up and running on `localhost:3001`.

    The front-end application should now be up and running. The app can be now accessed from a web browser @`localhost:3000`.

### NOTE: 
Make sure to check restapi container logs after each start using the following command:
   ```
   docker logs -f restapi
   ```
If any error related to service discovery with access denied is observed, refer Troubleshooting guide.

# Stopping and Cleaning up the application and blockchain

1. Stop node application, front-end application and removing fabric network from root directory using the following command from root directory:
   ```
   ./network-nft-auction.sh down
   ```
# Other options that are supported by the network-nft-auction.sh script
### app-up:
In order to bring up node application (restapi container) and front-end application (ui container) after the fabric network is up and running, use the following command from root directory:
   ```
   ./network-nft-auction.sh app-up
   ```
### app-down:
In order to bring down node application (restapi container) and front-end application (ui container) leaving the fabric network up and running, use the following command from root directory:
   ```
   ./network-nft-auction.sh app-down
   ```
### restart:
In order to cleanup the environment from previous run and then bring up the fabric network, node application and front-end application, use the following command from root directory:
   ```
   ./network-nft-auction.sh restart
   ```

# Troubleshooting
1. During node application (restapi container), if any access denied error is observed during service discovery as shown below:
   ```
   error: [DiscoveryResultsProcessor]: parseDiscoveryResults[defaultchannel] - Channel:defaultchannel received discovery error:access denied
   ```
   Take down the restapi container and bring back the restapi container using the following command:
   ```
   ./network-nft-auction.sh app-down
   ./network-nft-auction.sh app-up
   ```
