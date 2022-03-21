const constants = require('../constants');

module.exports.parseOnchainData = (onchainResponse) =>  {
    let parsedData;
    if (onchainResponse && onchainResponse.status == constants.onchainStatus.success) {
        
        parsedData = onchainResponse.objectBytes ? JSON.parse(onchainResponse.objectBytes) : null;
    } else {
        throw new Error(JSON.parse(onchainResponse.detail));
    }
    return parsedData;
}