const db = require("../db");

function checkRentalReminders() {
  try {
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);

    db.prepare(`
      UPDATE rentals
      SET status = 'expired'
      WHERE status = 'active' AND end_date <= ?
    `).run(now.toISOString());

    const rentals = db
      .prepare(`
        SELECT rentals.id, rentals.user_id, rentals.end_date,
               books.title
        FROM rentals
        JOIN books ON rentals.book_id = books.id
        LEFT JOIN notifications ON rentals.id = notifications.rental_id
        WHERE rentals.status = 'active'
          AND rentals.end_date > ?
          AND rentals.end_date <= ?
          AND notifications.id IS NULL
      `)
      .all(now.toISOString(), reminderDate.toISOString());

    for (const rental of rentals) {
      const endDate = new Date(rental.end_date).toLocaleString("ru-RU");
      const message = `Срок аренды книги «${rental.title}» закончится ${endDate}`;

      db.prepare(`
        INSERT INTO notifications (user_id, rental_id, message)
        VALUES (?, ?, ?)
      `).run(rental.user_id, rental.id, message);
    }

    if (rentals.length > 0) {
      console.log(`Создано напоминаний об аренде: ${rentals.length}`);
    }
  } catch (error) {
    console.error("Ошибка проверки сроков аренды:", error.message);
  }
}

function startRentalReminders() {
  checkRentalReminders();
  setInterval(checkRentalReminders, 60 * 1000);
}

module.exports = startRentalReminders;
