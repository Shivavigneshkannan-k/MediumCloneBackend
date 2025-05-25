const jwt = require("jsonwebtoken");

const createJwtToken = (user_id, email_id) => {
  const token = jwt.sign(
    { user_id, email_id },
    process.env.JWT_SECRECT,
    { expiresIn: "1h" }
  );
  return token;
};

module.exports = createJwtToken;
