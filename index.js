const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const viewRouter = require("./routes/view");
const worldDB  = require("./db");
const statusRouter = require("./routes/status");
const cors = require('cors');
const commentRouter = require("./routes/comments");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

// data parsing
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use(express.json());

// route handlers
app.use(authRouter);
app.use(postRouter);
app.use(viewRouter);
app.use(statusRouter);
app.use(commentRouter);

//error handler
app.use(errorHandler)


const testDB = async () => {
  try {
    const result = await worldDB.query('SELECT NOW() ');
    console.log("DB connection established at: ", result.rows[0].now);
    return true;
  } catch (err) {
    console.error("DB connection failed", Date.now());
    return false;
  }
};
const startServer = async () => {
  const success = await testDB();
  if (success) {
    app.listen(PORT, () => {
      console.log("app is running on port ", PORT);
    });
  }
};


startServer();