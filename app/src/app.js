const express = require("express");
const session = require("express-session");
const db = require("./db");
const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const adminRoutes = require("./routes/admin");
const startRentalReminders = require("./utils/rentalReminders");

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
app.use(adminRoutes);

app.get("/", (req, res) => {
  try {
    const sort = req.query.sort;
    let orderBy = "books.title ASC";

    if (sort === "author") {
      orderBy = "authors.name ASC";
    }

    if (sort === "category") {
      orderBy = "categories.name ASC";
    }

    if (sort === "year-new") {
      orderBy = "books.writing_year DESC";
    }

    if (sort === "year-old") {
      orderBy = "books.writing_year ASC";
    }

    const books = db
      .prepare(`
        SELECT books.id, books.title, books.writing_year, books.price,
               books.status, books.is_available, authors.name AS author,
               categories.name AS category
        FROM books
        JOIN authors ON books.author_id = authors.id
        JOIN categories ON books.category_id = categories.id
        ORDER BY ${orderBy}
      `)
      .all();

    let html = "<h1>Книжный магазин</h1>";

    if (req.session.userId) {
      html += `
        <p>Вы вошли как ${req.session.username}.</p>
        <p><a href="/my-books">Мои книги</a> | <a href="/logout">Выйти</a></p>
      `;

      if (req.session.role === "admin") {
        html += '<p><a href="/admin">Панель администратора</a></p>';
      }
    } else {
      html += '<p><a href="/register">Регистрация</a> | <a href="/login">Вход</a></p>';
    }

    html += "<h2>Каталог книг</h2>";
    html += `
      <form method="GET" action="/">
        <label for="sort">Сортировка:</label>
        <select id="sort" name="sort">
          <option value="title">По названию</option>
          <option value="author">По автору</option>
          <option value="category">По категории</option>
          <option value="year-new">Сначала новые</option>
          <option value="year-old">Сначала старые</option>
        </select>
        <button type="submit">Применить</button>
      </form>
    `;

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

startRentalReminders();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
