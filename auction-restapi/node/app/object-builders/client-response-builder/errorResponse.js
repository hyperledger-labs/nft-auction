// error response format
module.exports = {
    format: (message = null)=> {
        let status = "ERROR";
        return {status,message};
    }
};