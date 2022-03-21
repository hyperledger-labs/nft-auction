const {Wallets} = require('fabric-network');
const log4js = require('log4js');
const logger = log4js.getLogger('fabric-wallet-helper');

/**
  * Wallet object
  */
 const wallet = {};
 
 let fsWallet;
 
 // memory wallet for caching
 memoryWallet = {};

 wallet.create = async(walletPath) => {
    memoryWallet = await Wallets.newInMemoryWallet();
    logger.info('Built an in memory wallet');
	if (walletPath) {
		fsWallet = await Wallets.newFileSystemWallet(walletPath);
		logger.info(`Built a file system wallet at ${walletPath}`);
	}
}

 /**
  * Return in-memory wallet and hide FileSystemWallet object
  */
  wallet.getWallet = () => {
    return fsWallet || memoryWallet;
  };

  module.exports = wallet;