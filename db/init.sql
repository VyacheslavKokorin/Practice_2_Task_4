-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    balance REAL NOT NULL DEFAULT 2000.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Категории книг
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Авторы
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Книги
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    writing_year INTEGER NOT NULL,
    description TEXT NOT NULL,
    book_text TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 500.00,
    status TEXT NOT NULL DEFAULT 'В продаже',
    is_available INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (author_id) REFERENCES authors(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Покупки
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    price REAL NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Аренда книг
CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    rental_period TEXT NOT NULL,
    price REAL NOT NULL,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Уведомления пользователей
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    rental_id INTEGER,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO categories (id, name) VALUES
    (1, 'Фэнтези'),
    (2, 'Приключения');

INSERT OR IGNORE INTO authors (id, name) VALUES
    (1, 'Джоан Роулинг'),
    (2, 'Джон Рональд Руэл Толкин');

INSERT OR IGNORE INTO books
    (id, title, author_id, category_id, writing_year, description, book_text, price)
VALUES
    (
        1,
        'Гарри Поттер и философский камень',
        1,
        1,
        1997,
        'Первая книга о юном волшебнике Гарри Поттере и его учёбе в школе Хогвартс.',
        'Ознакомительный фрагмент книги будет доступен пользователю на странице чтения.',
        490.00
    ),
    (
        2,
        'Гарри Поттер и Тайная комната',
        1,
        1,
        1998,
        'Вторая книга о Гарри Поттере, в которой герои узнают тайну Хогвартса.',
        'Ознакомительный фрагмент книги будет доступен пользователю на странице чтения.',
        510.00
    ),
    (
        3,
        'Властелин колец: Братство Кольца',
        2,
        1,
        1954,
        'Начало путешествия Фродо и его друзей через Средиземье.',
        'Ознакомительный фрагмент книги будет доступен пользователю на странице чтения.',
        520.00
    ),
    (
        4,
        'Властелин колец: Две крепости',
        2,
        1,
        1954,
        'Продолжение путешествия участников Братства Кольца.',
        'Ознакомительный фрагмент книги будет доступен пользователю на странице чтения.',
        500.00
    ),
    (
        5,
        'Властелин колец: Возвращение короля',
        2,
        1,
        1955,
        'Заключительная часть истории о борьбе за Средиземье.',
        'Ознакомительный фрагмент книги будет доступен пользователю на странице чтения.',
        530.00
    );
