const constants = require('../constants');

const responseObjects = {
    userLoginResponse: (token, username, userType) => {
        let struct = {
            accessToken: token,
            username: username,
            userType: userType
        }
        return struct;
    }
}

module.exports = responseObjects;