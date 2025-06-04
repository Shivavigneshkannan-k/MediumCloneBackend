const express = require("express");
const userAuth = require("../middleware/userAuth");
const worldDB = require("../db");
const cloudinary = require("../cloudinary");
const fs = require("fs");
const upload = require("../middleware/multer.middleware");
const { createError } = require("../utils/createError");
const viewRouter = express.Router();
const authorizeRoles = require("../middleware/roleAuth.middleware");

viewRouter.get("/view/all",authorizeRoles('admin','user','guest'), async (req, res, next) => {
  try {
    let posts;
    if(req?.user){
      posts = await worldDB.query(
        `select p.post_id,p.title,p.body,p.user_id,u.username,u.photo_url,
          sum(case when r.reaction = 'like' then 1 else 0 end) as likes,
          sum(case when r.reaction = 'dislike' then 1 else 0 end) as dislikes,
          (select reaction from reactions as rs 
            where rs.post_id = p.post_id and
            rs.user_id = $1
          ) as user_reaction
        from posts as p
        left join reactions r
        on p.post_id = r.post_id
        inner join users as u
        on u.user_id = p.user_id
        group by p.post_id,p.title,p.body,p.user_id,u.username,u.photo_url;`,
        [req.user.user_id]
      );
    }
    else{
      posts = await worldDB.query(
        `select p.post_id,p.title,p.body,p.user_id,u.username,u.photo_url,
          sum(case when r.reaction = 'like' then 1 else 0 end) as likes,
          sum(case when r.reaction = 'dislike' then 1 else 0 end) as dislikes
        from posts as p
        left join reactions r
        on p.post_id = r.post_id
        inner join users as u
        on u.user_id = p.user_id
        group by p.post_id,p.title,p.body,p.user_id,u.username,u.photo_url;`
      );
    }
    res.status(200).json({ success: true, message: "all post", data: posts.rows });
  } catch (err) {
    next(err);
  }
});

viewRouter.get("/view/profile/:userId",authorizeRoles('admin','guest','user'), async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (userId == req.user.user_id) {
      res
        .status(200)
        .json({ success: true, message: "your profile", data: req.user });
    }
    const userProfile = await worldDB.query(
      `select * from users where user_id = $1`,
      [userId]
    );
    if (userProfile.rows.length == 0) {
      throw createError("User Not found", 404);
    }
    res.status(200).json({
      success: true,
      message: "your profile",
      data: userProfile.rows[0]
    });
  } catch (err) {
    next(err);
  }
});
viewRouter.get("/view/me", userAuth, authorizeRoles('admin','user'), async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "your profile",
      data: req.user
    });
  } catch (err) {
    next(err);
  }
});

viewRouter.patch("/edit/profile",userAuth,authorizeRoles('admin','user'),upload.single("image"),async (req, res, next) => {
    try {
      const localPath = req?.file?.path;
      const ALLOWED_FIELD = [
        "web development",
        "social",
        "nature",
        "technology"
      ];
      const { userName, bio, interest } = req.body;
      if (!userName) {
        const error = new Error("userName can't be empty");
        error.statusCode = 400;
        throw error;
      } else if (!bio && bio.length > 200) {
        const error = new Error("bio should be with in 200 letter");
        error.statusCode = 400;
        throw error;
      } else if (interest != "" && !ALLOWED_FIELD.includes(interest)) {
        const error = new Error("invalid interest");
        error.statusCode = 400;
        throw error;
      }
      if (localPath) {
        result = await cloudinary.uploader.upload(localPath,{
          folder:"medium.fake"
        });
        fs.unlink(localPath, (err) => {
          if (err) console.err("failed to delete local image", err);
        });
        const user = await worldDB.query(
          `UPDATE users SET username=$1,interest = $2,about=$3,photo_url=$4 WHERE user_id=$5 RETURNING *`,
          [userName, interest, bio, result.secure_url, req.user.user_id]
        );
        user.rows[0]["photo_url"] = result.secure_url;
        res.status(200).json({
          success: true,
          message: "profile updated",
          data: user.rows[0]
        });
      }

      const user = await worldDB.query(
        `UPDATE users SET username=$1,interest = $2,about=$3 WHERE user_id=$4 RETURNING *`,
        [userName, interest, bio, req.user.user_id]
      );
      res.status(200).json({
        success: true,
        message: "profile updated",
        data: user.rows[0]
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);

viewRouter.get("/view/reactions", async (req, res, next) => {
  try {
    const post = await worldDB.query(` 
        SELECT p.post_id,p.user_id,p.title,p.body,
        SUM(CASE WHEN reaction = 'like' THEN 1 ELSE 0 END) AS likes, 
        SUM(CASE WHEN reaction = 'dislike' THEN 1 ELSE 0 END) AS dislikes
        FROM reactions AS r RIGHT JOIN posts AS p ON r.post_id = p.post_id
        GROUP BY p.post_id,p.title,p.body;
      `);

    res
      .status(200)
      .json({ success: true, message: "reaction data", data: post.rows });
  } catch (err) {
    next(err);
  }
});
viewRouter.get("/view/user/reaction", userAuth, async (req, res, next) => {
  try {
    const post = await worldDB.query(
      `
        SELECT post_id,reaction from reactions where user_id = $1 
      `,
      [req.user.user_id]
    );
    res
      .status(200)
      .json({ success: true, message: "reaction data", data: post.rows });
  } catch (err) {
    next(err);
  }
});
viewRouter.get("/view/user/post/:userId", authorizeRoles('guest','admin','user'), async (req, res, next) => {
  try {
    const userId = req.params.userId;
    //checking user existence
    let userData;
    if(req?.user){
      
       userData = await worldDB.query(
        `select u.*, exists(select 1 from followers as f
        where f.user_id = $1
        and f.creator_id = $2
        ) as follow,
        exists(select 1 from followers as f
        where f.user_id =$2
        and f.creator_id = $1)
        as follow_back
      from users as u
      where u.user_id=$2`,
        [req.user.user_id, userId]
      );
    }
    else{
      userData = await worldDB.query(
        `select * from users where user_id=$1`,
        [userId]
      );
    }
    if (userData.rows.length == 0) {
      throw createError("user not found", 404);
    }
    const post = await worldDB.query(
      `
      select p.post_id,p.title,p.body,p.user_id,
      sum(case when r.reaction = 'like' then 1 else 0 end) as likes,
      sum(case when r.reaction = 'dislike' then 1 else 0 end) as dislikes,
      (select reaction from reactions as rs 
        where rs.post_id = p.post_id and
        rs.user_id = $1
      ) as user_reaction
      from posts as p
      left join reactions r
      on p.post_id = r.post_id
      group by p.post_id,p.title,p.body,p.user_id
      having p.user_id = $1
      `,
      [userId]
    );
    res
      .status(200)
      .json({
        success: true,
        message: "reaction data",
        data: { posts: post.rows, user: userData.rows[0] }
      });
  } catch (err) {
    next(err);
  }
});

module.exports = viewRouter;
