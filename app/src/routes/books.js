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
    let rentalForm = "";
    let userPurchase;
    let activeRental;

    if (req.query.purchased === "yes") {
      purchaseMessage = "<p>Книга успешно куплена.</p>";
    }

    if (req.query.rented === "yes") {
      purchaseMessage = "<p>Книга успешно арендована.</p>";
    }

    if (req.session.userId) {
      userPurchase = db
        .prepare("SELECT id FROM purchases WHERE user_id = ? AND book_id = ?")
        .get(req.session.userId, book.id);

      activeRental = db
        .prepare(`
          SELECT id, end_date FROM rentals
          WHERE user_id = ? AND book_id = ? AND status = 'active'
          ORDER BY end_date DESC
        `)
        .get(req.session.userId, book.id);

      if (activeRental && new Date(activeRental.end_date) <= new Date()) {
        activeRental = undefined;
      }
    }

    if (req.session.userId && book.is_available && !userPurchase) {
      const twoWeeksPrice = (book.price * 0.2).toFixed(2);
      const monthPrice = (book.price * 0.3).toFixed(2);
      const threeMonthsPrice = (book.price * 0.5).toFixed(2);

      purchaseForm = `
        <form method="POST" action="/books/${book.id}/buy">
          <button type="submit">Купить за ${book.price} руб.</button>
        </form>
      `;

      if (!activeRental) {
        rentalForm = `
          <form method="POST" action="/books/${book.id}/rent">
            <label for="period">Срок аренды:</label>
            <select id="period" name="period">
              <option value="two-weeks">2 недели — ${twoWeeksPrice} руб.</option>
              <option value="month">1 месяц — ${monthPrice} руб.</option>
              <option value="three-months">3 месяца — ${threeMonthsPrice} руб.</option>
            </select>
            <button type="submit">Арендовать</button>
          </form>
        `;
      }
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
      ${rentalForm}
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

router.post("/books/:id/rent", requireAuth, (req, res) => {
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

    let days;
    let rentalPrice;
    let periodName;

    if (req.body.period === "two-weeks") {
      days = 14;
      rentalPrice = book.price * 0.2;
      periodName = "2 недели";
    } else if (req.body.period === "month") {
      days = 30;
      rentalPrice = book.price * 0.3;
      periodName = "1 месяц";
    } else if (req.body.period === "three-months") {
      days = 90;
      rentalPrice = book.price * 0.5;
      periodName = "3 месяца";
    } else {
      return res.status(400).send("Выбран неверный срок аренды");
    }

    rentalPrice = Math.round(rentalPrice * 100) / 100;

    const purchase = db
      .prepare("SELECT id FROM purchases WHERE user_id = ? AND book_id = ?")
      .get(req.session.userId, book.id);

    if (purchase) {
      return res.status(400).send("Эта книга уже куплена");
    }

    const rental = db
      .prepare(`
        SELECT id, end_date FROM rentals
        WHERE user_id = ? AND book_id = ? AND status = 'active'
        ORDER BY end_date DESC
      `)
      .get(req.session.userId, book.id);

    if (rental && new Date(rental.end_date) > new Date()) {
      return res.status(400).send("У вас уже есть действующая аренда этой книги");
    }

    const user = db
      .prepare("SELECT balance FROM users WHERE id = ?")
      .get(req.session.userId);

    if (user.balance < rentalPrice) {
      return res.status(400).send("Недостаточно денег на балансе");
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    db.exec("BEGIN TRANSACTION");

    try {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?")
        .run(rentalPrice, req.session.userId);

      db.prepare(`
        INSERT INTO rentals (user_id, book_id, rental_period, price, end_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        req.session.userId,
        book.id,
        periodName,
        rentalPrice,
        endDate.toISOString()
      );

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    res.redirect(`/books/${book.id}?rented=yes`);
  } catch (error) {
    console.error("Ошибка аренды книги:", error.message);
    res.status(500).send("Не удалось арендовать книгу");
  }
});

router.get("/my-books", requireAuth, (req, res) => {
  try {
    db.prepare(`
      UPDATE rentals
      SET status = 'expired'
      WHERE user_id = ? AND status = 'active' AND end_date <= ?
    `).run(req.session.userId, new Date().toISOString());

    const user = db
      .prepare("SELECT username, balance FROM users WHERE id = ?")
      .get(req.session.userId);

    const purchases = db
      .prepare(`
        SELECT books.id, books.title, authors.name AS author,
               purchases.price, purchases.purchased_at
        FROM purchases
        JOIN books ON purchases.book_id = books.id
        JOIN authors ON books.author_id = authors.id
        WHERE purchases.user_id = ?
        ORDER BY purchases.purchased_at DESC
      `)
      .all(req.session.userId);

    const rentals = db
      .prepare(`
        SELECT books.id, books.title, authors.name AS author,
               rentals.rental_period, rentals.price, rentals.end_date
        FROM rentals
        JOIN books ON rentals.book_id = books.id
        JOIN authors ON books.author_id = authors.id
        WHERE rentals.user_id = ? AND rentals.status = 'active'
        ORDER BY rentals.end_date
      `)
      .all(req.session.userId);

    let html = `<h1>Мои книги</h1>`;
    html += `<p>Пользователь: ${user.username}</p>`;
    html += `<p>Баланс: ${user.balance.toFixed(2)} руб.</p>`;
    html += "<h2>Купленные книги</h2>";

    if (purchases.length === 0) {
      html += "<p>У вас пока нет купленных книг.</p>";
    } else {
      for (const purchase of purchases) {
        html += `
          <article>
            <h3><a href="/books/${purchase.id}">${purchase.title}</a></h3>
            <p>Автор: ${purchase.author}</p>
            <p>Цена покупки: ${purchase.price} руб.</p>
          </article>
        `;
      }
    }

    html += "<h2>Арендованные книги</h2>";

    if (rentals.length === 0) {
      html += "<p>У вас нет действующих аренд.</p>";
    } else {
      for (const rental of rentals) {
        html += `
          <article>
            <h3><a href="/books/${rental.id}">${rental.title}</a></h3>
            <p>Автор: ${rental.author}</p>
            <p>Срок: ${rental.rental_period}</p>
            <p>Аренда действует до: ${new Date(rental.end_date).toLocaleString("ru-RU")}</p>
          </article>
        `;
      }
    }

    html += '<p><a href="/">Вернуться к каталогу</a></p>';
    res.send(html);
  } catch (error) {
    console.error("Ошибка получения библиотеки пользователя:", error.message);
    res.status(500).send("Не удалось получить список книг пользователя");
  }
});

module.exports = router;
