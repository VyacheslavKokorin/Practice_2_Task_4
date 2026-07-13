const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDirectory = path.join(__dirname, "../../data");
const databasePath = path.join(dataDirectory, "book_store.db");
const initSqlPath = path.join(__dirname, "../../db/init.sql");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory);
}

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");

const initSql = fs.readFileSync(initSqlPath, "utf8");
db.exec(initSql);

module.exports = db;
