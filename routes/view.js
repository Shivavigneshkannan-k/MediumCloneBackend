const express = require("express");
const userAuth = require("../middleware/userAuth");
const worldDB = require("../db");
const { message } = require("statuses");
const viewRouter = express.Router();

viewRouter.get("/view/all", userAuth, async (req, res, next) => {
  try {
    const posts = await worldDB.query(
      "SELECT posts.post_id, posts.title, users.interest, posts.body, posts.created_at, users.user_id,users.username,users.email_id FROM posts INNER JOIN users ON posts.user_id= users.user_id"
    );
    res
      .status(200)
      .json({ success: true, message: "all post", data: posts.rows });
  } catch (err) {
    next(err);
  }
});

viewRouter.get("/view/profile",userAuth,async (req,res,next)=>{
  try{
      res.status(200).json({success: true,message: "your profile",data:req.user});
  }catch(err){
    next(err);
  }
})

viewRouter.patch("/edit/profile",userAuth,async(req,res,next)=>{
  try{
    
    const ALLOWED_FIELD = ["web development","social","nature","technology"]
    const {userName,bio,interest} = req.body;
    if(!userName){
      const error = new Error("userName can't be empty");
      err.statusCode = 400;
      throw error;
    }
    else if(bio.length>200){
      const error = new Error("bio should be with in 200 letter");
      err.statusCode = 400;
      throw error;
    }
    else if(interest!='' && !ALLOWED_FIELD.includes(interest)){
      const error = new Error("invalid interest");
      err.statusCode = 400;
      throw error;
    }

    const user = await worldDB.query(`UPDATE users SET username=$1,interest = $2,about=$3 WHERE user_id=$4 RETURNING *`,[
      userName,interest,bio,req.user.user_id
    ])

    res.status(200).json({success:true,message:"profile updated",data: user.rows[0]});


  }catch(err){
    next(err);
  }
})
viewRouter.get("/view/reactions",userAuth,async(req,res,next)=>{
  try{
      const post = await worldDB.query(` 
        SELECT p.post_id,p.user_id,p.title,p.body,
        SUM(CASE WHEN reaction = 'like' THEN 1 ELSE 0 END) AS likes, 
        SUM(CASE WHEN reaction = 'dislike' THEN 1 ELSE 0 END) AS dislikes
        FROM reactions AS r RIGHT JOIN posts AS p ON r.post_id = p.post_id
        GROUP BY p.post_id,p.title,p.body ;
        `);
      
      res.status(200).json({success: true,message: "reaction data",data:post.rows});

  }catch(err){
    next(err);
  }
})
viewRouter.get("/view/user/reaction",userAuth,async(req,res,next)=>{
  try{
      const post = await worldDB.query(`
        SELECT post_id,reaction from reactions where user_id = $1 
      `,[req.user.user_id]);
      res.status(200).json({success: true,message: "reaction data",data:post.rows});

  }catch(err){
    next(err);
  }
})
viewRouter.get("/view/user/post",userAuth,async(req,res,next)=>{
  try{
      const post = await worldDB.query(`
        SELECT p.post_id,p.user_id,p.title,p.body,
        SUM(CASE WHEN reaction = 'like' THEN 1 ELSE 0 END) AS likes, 
        SUM(CASE WHEN reaction = 'dislike' THEN 1 ELSE 0 END) AS dislikes
        FROM reactions AS r RIGHT JOIN posts AS p ON r.post_id = p.post_id
        where p.user_id = $1
        GROUP BY p.post_id,p.title,p.body; 
      `,[req.user.user_id]);
      res.status(200).json({success: true,message: "reaction data",data:post.rows});

  }catch(err){
    next(err);
  }
})

module.exports = viewRouter;
