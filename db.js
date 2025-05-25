const {Pool} = require("pg");
require("dotenv").config();

const worldDB = new Pool({
    user:"postgres",
    host:"localhost",
    database:"world",
    password:process.env.DB_PASSWORD,
    port:"5432",
})

module.exports = worldDB;