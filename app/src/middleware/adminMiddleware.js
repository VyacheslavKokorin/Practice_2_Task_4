function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).send(`
      <h1>Доступ запрещён</h1>
      <p>Эта страница доступна только администратору.</p>
      <p><a href="/">Вернуться на главную</a></p>
    `);
  }

  next();
}

module.exports = requireAdmin;
