const express = require("express");
const db = require("../db");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/admin", requireAdmin, (req, res) => {
  try {
    const books = db
      .prepare(`
        SELECT books.id, books.title, books.price, books.status,
               books.is_available, authors.name AS author,
               categories.name AS category
        FROM books
        JOIN authors ON books.author_id = authors.id
        JOIN categories ON books.category_id = categories.id
        ORDER BY books.title
      `)
      .all();

    let html = "<h1>Панель администратора</h1>";
    html += `<p>Всего книг: ${books.length}</p>`;

    for (const book of books) {
      html += `
        <article>
          <h2>${book.title}</h2>
          <p>Автор: ${book.author}</p>
          <p>Категория: ${book.category}</p>
          <p>Цена: ${book.price} руб.</p>
          <p>Статус: ${book.status}</p>
          <p>Доступность: ${book.is_available ? "Доступна" : "Недоступна"}</p>
          <hr>
        </article>
      `;
    }

    html += '<p><a href="/">Вернуться на главную</a></p>';
    res.send(html);
  } catch (error) {
    console.error("Ошибка получения списка книг для администратора:", error.message);
    res.status(500).send("Не удалось получить список книг");
  }
});

module.exports = router;
