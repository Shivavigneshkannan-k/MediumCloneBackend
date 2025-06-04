const express = require("express");
const viewRouter = require("./view");
const worldDB = require("../db");
const userAuth = require("../middleware/userAuth");
const statusRouter = express.Router();
const authorizeRoles = require("../middleware/roleAuth.middleware");
statusRouter.post("/status/:status/:postId", userAuth,authorizeRoles("user","admin"),async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const status = req.params.status;
    const user_id = req.user.user_id;
    console.log(user_id)
    const ALLOWED_STATUS = ["like",'dislike'];
    if(!(ALLOWED_STATUS.includes(status))){
        const error = new Error("INVALID STATUS");
        error.statusCode = 401;
        throw error;
    }
    const post = await worldDB.query('SELECT * FROM posts WHERE post_id = $1',[postId]);
    if(post.rows.length==0){
        const error = new Error("Post Not Found");
        error.statusCode = 404;
        throw error;
    }

    const reactionData = await worldDB.query('SELECT * FROM reactions WHERE post_id =$1 and user_id = $2',[postId,user_id]);
    let data = ""
    if(reactionData.rows.length==0){
        data = await worldDB.query('INSERT INTO reactions (post_id,user_id,reaction) VALUES ($1,$2,$3) RETURNING * ',[postId,user_id,status]);
    }
    else if(reactionData?.rows[0]?.reaction===status){
         data = await worldDB.query('DELETE FROM reactions WHERE post_id = $1 and user_id=$2 RETURNING *',[postId,user_id]);
         res.status(200).json({success:200,message: "reaction was deleted"});
    }
    else{
      data = await worldDB.query('UPDATE reactions SET reaction = $1, updated_at = NOW() WHERE post_id = $2 and user_id = $3 RETURNING *',[status,postId,user_id]);
      
    }
    
    
    // const postStatus = await worldDB.query('INSERT INTO status (status_id,post_id,user_id,status) VALUES ($1,$2,$3,$4) RETURNING *',[status_id,postId,user_id,status]);
    res.status(200).json({success:200, message:status+" added",data:data.rows[0]});
  } catch (err) {
    next(err);
  }
});

// statusRouter.patch("/status/:status/:postId", userAuth,async (req, res, next) => {
//   try {
//     const postId = req.params.postId;
//     const status = req.params.status;

//     const user_id = req.user.user_id;
//     const status_id = uuidv4();

//     const post = await worldDB.query('SELECT * FROM posts WHERE post_id = $1',[postId]);
//     if(post.rows.length==0){
//         const error = new Error("Post Not Found");
//         error.statusCode = 404;
//         throw error;
//     }
//     const statusData = await worldDB.query('SELECT * FROM status WHERE post_id = $1 and user_id = $2',[postId,user_id]);
//     if(statusData.rows.length==0){
//         const error = new Error("STATUS NOT FOUND");
//         error.statusCode = 404;
//         throw error;
//     }
//     const ALLOWED_STATUS = ["like",'dislike'];
//     if(!(ALLOWED_STATUS.includes(status))){
//         const error = new Error("INVALID STATUS");
//         error.statusCode = 401;
//         throw error;
//     }
//     console.log("status ->",statusData.rows[0].status_id);
//     const postStatus = await worldDB.query('UPDATE status SET status = $1, updated_at = NOW() WHERE status_id = $2 RETURNING *',[status,statusData.rows[0].status_id]);
//     res.status(200).json({success:200, message:status+" added",data:postStatus.rows[0]})
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = statusRouter;