function layout(title, content, req) {
  let userLinks = "";

  if (req.session.userId) {
    userLinks = `
      <span>Вы вошли как ${req.session.username}</span>
      <a href="/my-books">Мои книги</a>
      <a href="/notifications">Уведомления</a>
      <a href="/logout">Выйти</a>
    `;

    if (req.session.role === "admin") {
      userLinks += '<a href="/admin">Панель администратора</a>';
    }
  } else {
    userLinks = `
      <a href="/register">Регистрация</a>
      <a href="/login">Вход</a>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <header>
        <nav>
          <a href="/">Каталог</a>
          ${userLinks}
        </nav>
      </header>
      <main>
        ${content}
      </main>
    </body>
    </html>
  `;
}

module.exports = layout;
