const jwt = require("jsonwebtoken");
const worldDB = require("../db");
const userAuth = async (req,res,next)=>{
    try{
        const token = req.cookies.namasteBlog;
        if(!token){
            const err = new Error("Invalid Credientials, Please Login!!");
            err.statusCode = 400;
            throw err;
        }

        const data = jwt.verify(token,process.env.JWT_SECRECT);
        const {user_id,email_id} = data;
        const userData = await worldDB.query('SELECT * FROM USERS WHERE user_id = ($1)',[user_id]);
        if(userData.rows.length==0){
            const err = new Error("User Not found");
            err.statusCode = 400;
            throw err;
        }

        req.user = userData.rows[0];
        next();

    }catch(err){
        next(err);
    }
}

module.exports = userAuth;