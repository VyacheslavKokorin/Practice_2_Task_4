const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/books/:id", (req, res) => {
  try {
    const book = db
      .prepare(`
        SELECT books.*, authors.name AS author, categories.name AS category
        FROM books
        JOIN authors ON books.author_id = authors.id
        JOIN categories ON books.category_id = categories.id
        WHERE books.id = ?
      `)
      .get(req.params.id);

    if (!book) {
      return res.status(404).send("Книга не найдена");
    }

    res.send(`
      <h1>${book.title}</h1>
      <p>Автор: ${book.author}</p>
      <p>Категория: ${book.category}</p>
      <p>Год написания: ${book.writing_year}</p>
      <p>Цена: ${book.price} руб.</p>
      <p>Статус: ${book.status}</p>
      <h2>Описание</h2>
      <p>${book.description}</p>
      <h2>Чтение книги</h2>
      <p>${book.book_text}</p>
      <p><a href="/">Вернуться к каталогу</a></p>
    `);
  } catch (error) {
    console.error("Ошибка получения книги:", error.message);
    res.status(500).send("Не удалось получить книгу");
  }
});

module.exports = router;
