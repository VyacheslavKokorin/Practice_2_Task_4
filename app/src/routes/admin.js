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
          <p><a href="/admin/books/${book.id}/edit">Изменить</a></p>
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

router.get("/admin/books/:id/edit", requireAdmin, (req, res) => {
  try {
    const book = db
      .prepare("SELECT * FROM books WHERE id = ?")
      .get(req.params.id);

    if (!book) {
      return res.status(404).send("Книга не найдена");
    }

    res.send(`
      <h1>Изменение книги</h1>
      <h2>${book.title}</h2>
      <form method="POST" action="/admin/books/${book.id}/edit">
        <div>
          <label for="price">Цена:</label>
          <input id="price" type="number" name="price" step="0.01" min="0" value="${book.price}" required>
        </div>
        <div>
          <label for="status">Статус:</label>
          <select id="status" name="status">
            <option value="В продаже" ${book.status === "В продаже" ? "selected" : ""}>В продаже</option>
            <option value="Нет в продаже" ${book.status === "Нет в продаже" ? "selected" : ""}>Нет в продаже</option>
            <option value="Скоро в продаже" ${book.status === "Скоро в продаже" ? "selected" : ""}>Скоро в продаже</option>
          </select>
        </div>
        <div>
          <label for="is_available">Доступность:</label>
          <select id="is_available" name="is_available">
            <option value="1" ${book.is_available ? "selected" : ""}>Доступна</option>
            <option value="0" ${book.is_available ? "" : "selected"}>Недоступна</option>
          </select>
        </div>
        <button type="submit">Сохранить</button>
      </form>
      <p><a href="/admin">Вернуться в панель администратора</a></p>
    `);
  } catch (error) {
    console.error("Ошибка получения книги для изменения:", error.message);
    res.status(500).send("Не удалось получить книгу");
  }
});

router.post("/admin/books/:id/edit", requireAdmin, (req, res) => {
  try {
    const price = parseFloat(req.body.price);
    const status = req.body.status;
    const isAvailable = parseInt(req.body.is_available);

    if (isNaN(price) || price < 0) {
      return res.status(400).send("Указана неверная цена");
    }

    db.prepare(`
      UPDATE books
      SET price = ?, status = ?, is_available = ?
      WHERE id = ?
    `).run(price, status, isAvailable, req.params.id);

    res.redirect("/admin");
  } catch (error) {
    console.error("Ошибка изменения книги:", error.message);
    res.status(500).send("Не удалось изменить книгу");
  }
});

module.exports = router;
