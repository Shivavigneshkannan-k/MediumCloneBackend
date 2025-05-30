const createError = (name,code)=>{
    const err = new Error(name);
    err.statusCode = code;
    return err;
}
module.exports={createError}