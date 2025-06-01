const express = require("express");
const userAuth = require("../middleware/userAuth");
const worldDB = require("../db");
const { createError } = require("../utils/createError");
const followRouter = express.Router();

followRouter.use(userAuth);

followRouter.post("/follow/:creator_id", async (req, res, next) => {
  try {
    const creator_id = req.params.creator_id;
    const user_id = req.user.user_id;

    // user trying to follow themself -- is illegal
    if (user_id === creator_id) {
      throw createError("you can't follow yourself", 400);
    }

    // creator exist check
    const creatorProfile = await worldDB.query(
      "select * from users where user_id = $1",
      [creator_id]
    );
    if (creatorProfile.rows.length == 0) {
      throw createError("User Not found", 404);
    }

    // user trying follow the same creator again
    const isConnectionExist = await worldDB.query(
      `select * from followers where user_id = $1 and creator_id = $2`,
      [user_id, creator_id]
    );
    if (isConnectionExist.rows.length > 0) {
      throw createError("connect already exist", 400);
    }

    //creating connection b/w user and creator
    const connectionDetails = await worldDB.query(
      `insert into followers (user_id,creator_id) values ($1,$2)
                returning *`,
      [user_id, creator_id]
    );
    res.status(200).json({
      success: true,
      message: "you're currently following " + creatorProfile.rows[0].username,
      data: connectionDetails.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

followRouter.delete("/follow/:creator_id", async (req, res, next) => {
  try {
    const creator_id = req.params.creator_id;
    const user_id = req.user.user_id;

    // user trying to unfollow themself -- is illegal
    if (user_id === creator_id) {
      throw createError("sorry can't unfollow yourself", 400);
    }

    // creator exist check
    const creatorProfile = await worldDB.query(
      "select * from users where user_id = $1",
      [creator_id]
    );

    if (creatorProfile.rows.length == 0) {
      throw createError("User Not found", 404);
    }

    // user trying unfollow the creator who he/she isn't following
    const isConnectionExist = await worldDB.query(
      `select * from followers where user_id = $1 and creator_id = $2`,
      [user_id, creator_id]
    );

    if (isConnectionExist.rows.length === 0) {
      throw createError("connect doesn't already exist", 404);
    }

    //creating connection b/w user and creator
    await worldDB.query(
      `delete from followers where user_id = $1 and creator_id = $2`,
      [user_id, creator_id]
    );

    res.status(200).json({
      success: true,
      message: "unfollowed " + creatorProfile.rows[0].username
    });
  } catch (err) {
    next(err);
  }
});

followRouter.get("/follow/:type", async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const type = req.params.type;
    const ALLOWED_TYPES = ["following", "followers"];
    if (!ALLOWED_TYPES.includes(type)) {
      throw createError("invalid type", 400);
    }
    let list;
    if (type === "following") {
      list = await worldDB.query(
        `select c.username,c.user_id,c.photo_url 
                    from followers as f
                    join users as c
                    on f.creator_id = c.user_id
                    where f.user_id = $1
                    `,
        [user_id]
      );
    } else {
      list = await worldDB.query(
        `select u.username follower_name, u.user_id follower_id,
        (case when fb.user_id is not null then true else false end) as follow_back
        from users as u
        join followers f
        on f.user_id = u.user_id
        left join followers fb
        on fb.creator_id = u.user_id
        where f.creator_id = $1`,
        [user_id]
      );
    }
    res
      .status(200)
      .json({ success: true, message: `list of ${type}`, data: list.rows });
  } catch (err) {
    next(err);
  }
});
module.exports = followRouter;
