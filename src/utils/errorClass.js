import { MongooseError } from "mongoose"


class customError extends Error {
    constructor(message,statusCode){
        super(message);
        Object.assign(this, MongooseError.prototype);
        this.statusCode=statusCode
    
    }
}
export default customError