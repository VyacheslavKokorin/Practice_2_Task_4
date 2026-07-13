const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.get("/register", (req, res) => {
  res.send(`
    <h1>Регистрация</h1>
    <form method="POST" action="/register">
      <div>
        <label>Имя пользователя</label>
        <input type="text" name="username" required>
      </div>
      <div>
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div>
        <label>Пароль</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Зарегистрироваться</button>
    </form>
    <p><a href="/">Вернуться на главную</a></p>
  `);
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send("Заполните все поля");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db
      .prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `)
      .run(username, email, passwordHash);

    req.session.userId = Number(result.lastInsertRowid);
    req.session.username = username;
    req.session.role = "user";

    res.redirect("/");
  } catch (error) {
    console.error("Ошибка регистрации:", error.message);
    res.status(400).send("Пользователь с таким именем или email уже существует");
  }
});

module.exports = router;
