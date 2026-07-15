const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const layout = require("../views/layout");

const router = express.Router();

router.get("/register", (req, res) => {
  const html = `
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
  `;

  res.send(layout("Регистрация", html, req));
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

router.get("/login", (req, res) => {
  const html = `
    <h1>Вход</h1>
    <form method="POST" action="/login">
      <div>
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div>
        <label>Пароль</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Войти</button>
    </form>
    <p><a href="/">Вернуться на главную</a></p>
  `;

  res.send(layout("Вход", html, req));
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(400).send("Неверный email или пароль");
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsCorrect) {
      return res.status(400).send("Неверный email или пароль");
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.redirect("/");
  } catch (error) {
    console.error("Ошибка входа:", error.message);
    res.status(500).send("Не удалось выполнить вход");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
