# Prerequisites

To successfully run the application, you will need several dependencies installed on your machine. We will show the commands to install these dependencies for Ubuntu 20.04. The commands for other OS should be available in the corresponding application documentations.

If not already installed, you will need to install Node.js, Go, make, curl, jq, Git, Docker, and Docker-Compose on your Ubuntu system. 
Use the steps in each section below to properly install them.

## Install Node.js
Recommended version - 14.x
Node.js can be installed either directly or using nvm (node version manager). Follow the below steps to install it using nvm.

### Install nvm
Note: 
Check if bashrc file exists using `ls ~/.bashrc`. If it does not exist, add the file using `touch ~/.bashrc`.
Check if profile file(current user) exists using `ls ~/.profile`. If it does not exist, add the file using `touch ~/.profile`.

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
nvm install 14
nvm use 14
```

## Install Golang
The smart contracts we use are written in Go. Follow the below steps to install it. Version 1.16 is recommended.
For ubuntu:
```
wget https://dl.google.com/go/go1.16.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf  go1.16.5.linux-amd64.tar.gz
```
Check if .profile file exists(for a current user installation) using `ls ~/.profile`. If it does not exist, add the file using `touch ~/.profile`.
Open the file using vi editor
`vi ~/.profile`
Append the following line
`export PATH=$PATH:/usr/local/go/bin`
Source the profile
`source ~/.profile`
Check if go is installed
`go version`

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

2. Open a terminal from the root directory of the code repo and run the blockchain network using the following commands: 
    ```
    cd auction-resapi/network/local
    ./start.sh
    ``` 
    The script will stand up a simple Fabric network. The network has two peer organizations with two peer each and a single node raft ordering service

3. After the blockchain network setup is complete, start the Node.js backend server using the following commands:
    ```
    cd auction-resapi/node
    npm install
    npm start
    ```
    The node application should now be up and running on `localhost:3001`.

4. Open another terminal from the root directory of the code repo and start the UI application using the following commands:
    ```
    cd auction-ui
    npm install
    npm start
    ```
    The front-end application should now be up and running. The app can be now accessed from a web browser @`localhost:3000`. 
