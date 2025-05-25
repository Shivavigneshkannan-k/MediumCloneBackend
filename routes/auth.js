const express = require("express");
const authRouter = express.Router();
const { validateSignUp, validateLogin } = require("../middleware/validators");
const bcrypt = require("bcrypt");
const worldDB = require("../db");
const createJwtToken = require("../middleware/jwtToken");

authRouter.post("/signup", validateSignUp, async (req, res, next) => {
  try {
    const { emailId, password, username } = req.body;
    const user_id = req.user_id;

    const token = createJwtToken(user_id, emailId);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await worldDB.query(
      "INSERT INTO USERS (user_id,email_id,password,username) VALUES ($1,$2,$3,$4) RETURNING *",
      [user_id, emailId, hashedPassword, username]
    );
    res
      .status(201)
      .cookie("namasteBlog", token)
      .json({
        success: true,
        message: "signup successfully",
        user: user.rows[0]
      });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validateLogin, async (req, res, next) => {
  try {
    const user = req.user;
    const token = createJwtToken(user.user_id, user.email_id);
    res
      .status(200).cookie("namasteBlog", token,{expiresIn: 3600*100})
      .json({ success: true, message: "login successfully", data: user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res, next) => {
  try {
    res
      .status(200)
      .cookie("namasteBlog", null, { expires: new Date() })
      .json({ success: true, message: "loggout successfully!!" });
  } catch (err) {
    next(err);
  }
});

module.exports = authRouter;
