function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send(`
      <h1>Необходим вход</h1>
      <p>Для выполнения этого действия необходимо войти в аккаунт.</p>
      <p><a href="/login">Перейти ко входу</a></p>
    `);
  }

  next();
}

module.exports = requireAuth;
