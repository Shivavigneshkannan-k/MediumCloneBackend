const { createError } = require("../utils/createError");

module.exports = authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
        const user_role = req?.user?.role || req?.headers?.role;
        console.log(user_role)
        if(!allowedRoles.includes(user_role)){
            throw createError('unauthorized access',401);
        }
        next();
    } catch (err) {
      throw err;
    }
  };
};
