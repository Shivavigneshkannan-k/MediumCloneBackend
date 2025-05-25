const express = require("express");
const { post } = require("./auth");
const postRouter = express.Router();
const worldDB = require("../db");
const userAuth = require("../middleware/userAuth");
const { v4: uuidv4 } = require("uuid");
const { message } = require("statuses");

postRouter.post("/post/create", userAuth, async (req, res,next) => {
  try {
    const { title, body } = req.body;
    const user_id = req.user.user_id;
    const post_id = uuidv4();
    const newPost = await worldDB.query(
      "INSERT INTO posts (post_id,user_id,title,body) VALUES ($1,$2,$3,$4) RETURNING *",
      [post_id, user_id, title, body]
    );
    res
      .status(200)
      .json({
        success: true,
        message: title + " added",
        data: newPost.rows[0]
      });
  } catch (err) {
    next(err);
  }
});
postRouter.patch("/post/edit/:postId", userAuth, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const { title, body } = req.body;
    const post = await worldDB.query("SELECT * FROM POSTS WHERE post_id=($1)", [
      postId
    ]);
    if (post.rows.length == 0) {
      const err = new Error("Post Not found");
      err.statusCode = 404;
      throw err;
    }

    if (post.rows[0].user_id !== req.user.user_id) {
      const err = new Error("Access Deined");
      err.statusCode = 403;
      throw err;
    }
    const updatedPost = await worldDB.query(
      "UPDATE POSTS SET title = $1, body = $2, updated_at = NOW() WHERE post_id = $3 RETURNING *",
      [title, body, postId]
    );
    res
      .status(200)
      .json({
        success: true,
        message: "successfully updated",
        data: updatedPost.rows[0]
      });
  } catch (err) {
    next(err);
  }
});

postRouter.delete("/post/delete/:postId", userAuth, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await worldDB.query("SELECT * FROM POSTS WHERE post_id = $1", [
      postId
    ]);
    if (post.rows.length == 0) {
      const err = new Error("Post Not found");
      err.statusCode = 404;
      throw err;
    }
    if (post.rows[0].user_id !== req.user.user_id) {
      const err = new Error("Access Denied");
      err.statusCode = 403;
      throw err;
    }
    await worldDB.query("DELETE FROM POSTS WHERE post_id = $1", [postId]);
    res.status(200).json({ success: true, message: "delete successfully" });
  } catch (err) {
    next(err);
  }
});


module.exports = postRouter;
