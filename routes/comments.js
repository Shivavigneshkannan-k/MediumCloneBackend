const express = require("express");
const userAuth = require("../middleware/userAuth");
const worldDB = require("../db");
const { message } = require("statuses");
const commentRouter = express.Router();
const { v4: uuidv4 } = require("uuid");

commentRouter.post("/comment/create", userAuth, async (req, res, next) => {
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
    res.status(200).json({
      success: true,
      message: "succesfully comment is added",
      data: commentData.rows[0]
    });
  } catch (err) {
    next(err);
  }
});
commentRouter.get("/comment/read/:postId", userAuth, async (req, res, next) => {
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
      `select * from comments where post_id = $1`,
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
module.exports = commentRouter;
