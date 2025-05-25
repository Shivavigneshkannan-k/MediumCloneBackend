const { isEmail, isStrongPassword } = require("validator");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const worldDB = require("../db");

const validateSignUp = (req, res, next) => {
  let { emailId, password, username } = req.body;
  req.body.emailId = emailId.trim();
  req.body.password = password.trim();
  req.body.username = username.trim();

  try {
    if (!username || !emailId || !password) {
      const error = new Error("fields can't be empty");
      error.statusCode = 400;
      throw error;
    } else if (!isEmail(emailId)) {
      const error = new Error("Invalid Email Id");
      error.statusCode = 400;
      throw error;
    } else if (!isStrongPassword(password)) {
      const error = new Error("Weak password");
      error.statusCode = 400;
      throw error;
    }

    req.user_id = uuidv4();
    req.body.emailId = req.body.emailId.toLowerCase();
    next();
  } catch (err) {
    next(err);
  }
};

const validateLogin = async (req, res, next) => {
  try {
    const emailId = req.body.emailId;
    const password = req.body.password;
    if (!isEmail(emailId)) {
      const error = new Error("Invalid Credientials");
      error.statusCode = 400;
      throw error;
    }
    const data = await worldDB.query(
      "SELECT * FROM USERS WHERE email_id=($1)",
      [emailId]
    );
    if (data.rows.length == 0) {
      const error = new Error("User Not Found");
      error.statusCode = 404;
      throw error;
    }
    const user = data.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const error = new Error("Invalid Credientials");
      error.statusCode = 400;
      throw error;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validateSignUp, validateLogin };
