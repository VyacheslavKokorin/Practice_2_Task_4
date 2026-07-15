const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/notifications", requireAuth, (req, res) => {
  try {
    const notifications = db
      .prepare(`
        SELECT id, message, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(req.session.userId);

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `).run(req.session.userId);

    let html = "<h1>Уведомления</h1>";

    if (notifications.length === 0) {
      html += "<p>У вас пока нет уведомлений.</p>";
    } else {
      for (const notification of notifications) {
        html += `
          <article>
            <p>${notification.is_read ? "" : "Новое: "}${notification.message}</p>
            <p>Дата: ${new Date(notification.created_at).toLocaleString("ru-RU")}</p>
            <hr>
          </article>
        `;
      }
    }

    html += '<p><a href="/">Вернуться на главную</a></p>';
    res.send(html);
  } catch (error) {
    console.error("Ошибка получения уведомлений:", error.message);
    res.status(500).send("Не удалось получить уведомления");
  }
});

module.exports = router;
