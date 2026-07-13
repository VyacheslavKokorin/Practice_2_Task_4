const express = require("express");
const session = require("express-session");
const db = require("./db");
const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");

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
app.use(authRoutes);
app.use(booksRoutes);

app.get("/", (req, res) => {
  try {
    const books = db
      .prepare(`
        SELECT books.id, books.title, books.writing_year, books.price,
               books.status, books.is_available, authors.name AS author,
               categories.name AS category
        FROM books
        JOIN authors ON books.author_id = authors.id
        JOIN categories ON books.category_id = categories.id
        ORDER BY books.title
      `)
      .all();

    let html = "<h1>Книжный магазин</h1>";

    if (req.session.userId) {
      html += `<p>Вы вошли как ${req.session.username}. <a href="/logout">Выйти</a></p>`;
    } else {
      html += '<p><a href="/register">Регистрация</a> | <a href="/login">Вход</a></p>';
    }

    html += "<h2>Каталог книг</h2>";

    for (const book of books) {
      html += `
        <article>
          <h3><a href="/books/${book.id}">${book.title}</a></h3>
          <p>Автор: ${book.author}</p>
          <p>Категория: ${book.category}</p>
          <p>Год написания: ${book.writing_year}</p>
          <p>Цена: ${book.price} руб.</p>
          <p>Статус: ${book.status}</p>
          <p>${book.is_available ? "Доступна" : "Недоступна"}</p>
          <hr>
        </article>
      `;
    }

    res.send(html);
  } catch (error) {
    console.error("Ошибка получения книг:", error.message);
    res.status(500).send("Не удалось получить список книг");
  }
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
