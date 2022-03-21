// success response format
module.exports = {

    format: (status,detail)=> {
        if (!status || !Number.isInteger(status) || status < 1 ) {
            throw new Error("Status is not a non-zero positive integer.");
        }
        if (!detail) {
            throw new Error("Detail is empty.");
        }
        return {status: status, detail: detail};
    }
};