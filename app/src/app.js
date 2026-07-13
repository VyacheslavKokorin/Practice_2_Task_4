const express = require("express");
const session = require("express-session");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("<h1>Книжный магазин</h1><p>Приложение работает</p>");
});

app.get("/db-check", (req, res) => {
  try {
    const result = db.prepare("SELECT 1 AS result").get();

    res.json({
      message: "Подключение к БД работает",
      result: result.result
    });
  } catch (error) {
    console.error("Ошибка подключения к БД:", error.message);
    res.status(500).json({
      message: "Ошибка подключения к БД"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
