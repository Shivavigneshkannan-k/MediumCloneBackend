const express = require("express");
const userAuth = require("../middleware/userAuth");
const worldDB = require("../db");
const commentRouter = express.Router();
const { v4: uuidv4 } = require("uuid");
const { createError } = require("../utils/createError");
const  authorizeRoles  = require("../middleware/roleAuth.middleware");

commentRouter.post("/comment/create", userAuth, authorizeRoles("user",'admin'), async (req, res, next) => {
  try {
    const { post_id, commenter_id, comment } = req.body;
    const post = await worldDB.query(`select * from posts where post_id = $1`, [
      post_id
    ]);
    if (post.rows.length == 0) {
      const err = new Error("Post Not found");
      err.statusCode = 404;
      throw err;
    }
    const commenter = await worldDB.query(
      `select * from users where user_id = $1`,
      [commenter_id]
    );
    if (commenter.rows.length == 0) {
      const err = new Error("No user found");
      err.statusCode = 404;
      throw err;
    }
    const comment_id = uuidv4();
    const commentData = await worldDB.query(
      `insert into comments (comment_id,post_id,commenter_id,comment) values ($1,$2,$3,$4) returning *`,
      [comment_id, post_id, commenter_id, comment]
    );
    commentData.rows[0]["username"]=req.user.username;
    res.status(200).json({
      success: true,
      message: "succesfully comment is added",
      data: commentData.rows[0]
    });
  } catch (err) {
    next(err);
  }
});
commentRouter.get("/comment/read/:postId",authorizeRoles('guest','admin','user'), async (req, res, next) => {
  try {
    const post_id = req?.params?.postId;
    console.log(post_id);
    const post = await worldDB.query(`select * from posts where post_id = $1`, [
      post_id
    ]);
    if (post.rows.length == 0) {
      const err = new Error("Post Not found");
      err.statusCode = 404;
      throw err;
    }
    const comments = await worldDB.query(
      `select c.comment,c.comment_id,c.commenter_id,s.username
      from comments as c
      join users as s
      on s.user_id = c.commenter_id
      where post_id = $1`,
      [post_id]
    );
    res.status(200).json({
      success: true,
      message: "successfully reterived the data",
      data: comments.rows
    });
  } catch (err) {
    next(err);
  }
});

commentRouter.delete( "/comment/delete/:commentId",userAuth,authorizeRoles('user','admin'),async (req, res, next) => {
    try {
      const commentId = req.params.commentId;
      const comment = await worldDB.query(
        `
      select * from comments where comment_id = $1
      `,
        [commentId]
      );
      if (comment.rows.length == 0) {
        throw createError("Comment Not found", 404);
      }
      console.log(req.user.role)
      if (comment.rows[0].commenter_id !== req.user.user_id && req?.user?.role!=='admin') {
        throw createError("Access Denied", 403);
      }
      const data = await worldDB.query(
        `
        delete from comments
        where comment_id = $1
        `,
        [commentId]
      );
      res.json({ success: true, message: "comment is successfully deleted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = commentRouter;
