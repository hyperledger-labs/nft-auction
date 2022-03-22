# Prerequisites

To successfully run the application, you will need several dependencies installed on your machine. We will show the commands to install these dependencies for Ubuntu 20.04. The commands for other OS should be available in the corresponding application documentations.

If not already installed, you will need to install Node.js, Go, make, curl, jq, Git, Docker, and Docker-Compose on your Ubuntu system. 
Use the steps in each section below to properly install them.

## Install Node.js
Recommended version - 16.x
Node.js can be installed either directly or using nvm (node version manager). Follow the below steps to install it using nvm.

### Install nvm
For ubuntu:
```
sudo apt-get install build-essential libssl-dev -y
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
source ~/.bashrc
source ~/.profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```
### Install required Node.js version
```
nvm install v16.14.1
nvm use v16.14.1
```

## Install Golang
The smart contracts we use are written in Go. Follow the below steps to install it. Version 1.16 is recommended.
For ubuntu:
```
wget https://dl.google.com/go/go1.16.5.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf  go1.16.5.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
go version
```
**Troubleshooting note**: If you have "permission denied" error in untarring the file, please make sure to have correct ownership of directories, or you may want to use `sudo` for the untar. 
For more details or troubleshooting, see https://golang.org/doc/install

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
sudo usermod -aG docker $(whoami)
echo "Added currect user to docker group"
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

1. After the prerequisites are installed, follow the below instructions to start the application on local machine.

2. Open a terminal and run the blockchain network setup using the following commands: 
    ```
    cd auction-resapi/network/local
    ./start.sh
    ``` 
    The script will stand up a simple Fabric network. The network has two peer organizations with two peer each and a single node raft ordering service

3. After the blockchain network setup is complete, start the node application using the following commands:
    ```
    cd auction-resapi/node
    npm install
    npm start
    ```
    The node application should now be up and running on `localhost:3001`.

4. Open another terminal, start the UI application using the following commands:
    ```
    cd auction-ui
    npm install
    npm start
    ```
    The front-end application should now be up and running. The app can be now accessed from a web browser @`localhost:3000`. 
