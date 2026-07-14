const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/authMiddleware");

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

    let purchaseMessage = "";
    let purchaseForm = "";

    if (req.query.purchased === "yes") {
      purchaseMessage = "<p>Книга успешно куплена.</p>";
    }

    if (req.session.userId && book.is_available) {
      purchaseForm = `
        <form method="POST" action="/books/${book.id}/buy">
          <button type="submit">Купить за ${book.price} руб.</button>
        </form>
      `;
    }

    res.send(`
      <h1>${book.title}</h1>
      ${purchaseMessage}
      <p>Автор: ${book.author}</p>
      <p>Категория: ${book.category}</p>
      <p>Год написания: ${book.writing_year}</p>
      <p>Цена: ${book.price} руб.</p>
      <p>Статус: ${book.status}</p>
      <h2>Описание</h2>
      <p>${book.description}</p>
      <h2>Чтение книги</h2>
      <p>${book.book_text}</p>
      ${purchaseForm}
      <p><a href="/">Вернуться к каталогу</a></p>
    `);
  } catch (error) {
    console.error("Ошибка получения книги:", error.message);
    res.status(500).send("Не удалось получить книгу");
  }
});

router.post("/books/:id/buy", requireAuth, (req, res) => {
  try {
    const book = db
      .prepare("SELECT * FROM books WHERE id = ?")
      .get(req.params.id);

    if (!book) {
      return res.status(404).send("Книга не найдена");
    }

    if (!book.is_available) {
      return res.status(400).send("Книга сейчас недоступна");
    }

    const purchase = db
      .prepare("SELECT id FROM purchases WHERE user_id = ? AND book_id = ?")
      .get(req.session.userId, book.id);

    if (purchase) {
      return res.status(400).send("Вы уже купили эту книгу");
    }

    const user = db
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(req.session.userId);

    if (user.balance < book.price) {
      return res.status(400).send("Недостаточно денег на балансе");
    }

    db.exec("BEGIN TRANSACTION");

    try {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?")
        .run(book.price, req.session.userId);

      db.prepare(`
        INSERT INTO purchases (user_id, book_id, price)
        VALUES (?, ?, ?)
      `).run(req.session.userId, book.id, book.price);

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    res.redirect(`/books/${book.id}?purchased=yes`);
  } catch (error) {
    console.error("Ошибка покупки книги:", error.message);
    res.status(500).send("Не удалось купить книгу");
  }
});

module.exports = router;
