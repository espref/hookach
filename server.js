const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'hookach.db');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- DB INIT ---
const db = new sqlite3.Database(DB_PATH);

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS tobaccos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      tags TEXT NOT NULL,
      strength INTEGER NOT NULL DEFAULT 3
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS mixes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      bowl_type TEXT,
      heat_resistance TEXT,
      season TEXT,
      complexity TEXT,
      strength INTEGER,
      is_featured INTEGER DEFAULT 0
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS mix_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mix_id INTEGER NOT NULL,
      tobacco_id INTEGER NOT NULL,
      percent INTEGER NOT NULL,
      FOREIGN KEY (mix_id) REFERENCES mixes(id),
      FOREIGN KEY (tobacco_id) REFERENCES tobaccos(id)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mix_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mix_id) REFERENCES mixes(id)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL,
      mix_id INTEGER,
      custom_mix_json TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mix_id) REFERENCES mixes(id)
    )`
  );

  const count = await get(db, 'SELECT COUNT(*) as c FROM tobaccos');
  if (!count || count.c === 0) {
    await seedData();
  }
}

async function seedData() {
  const tobaccos = [
    // Примеры, можно расширить при необходимости
    { brand: 'Blackburn', name: 'Малина лимонад', tags: 'фрукты,ягоды,лимонад,кислый,сладкий,лето', strength: 4 },
    { brand: 'Blackburn', name: 'Грейпфрут', tags: 'фрукты,цитрус,кислый,терпкий,лето', strength: 5 },
    { brand: 'Overdose', name: 'Энерджи', tags: 'напитки,энергетик,сладкий,вечеринка', strength: 7 },
    { brand: 'Banger', name: 'Лимонный пирог', tags: 'десерты,выпечка,лимон,сладкий,зима', strength: 5 },
    { brand: 'NАШ', name: 'Чай с бергамотом', tags: 'напитки,чай,цитрус,вечер,расслабляющий', strength: 3 },
    { brand: 'Sebero', name: 'Клубника мята', tags: 'ягоды,мята,прохлада,сладкий,лето', strength: 4 },
    { brand: 'Chabacco', name: 'Тархун', tags: 'травы,напитки,тархун,сладкий,лето', strength: 3 },
    { brand: 'Spectrum', name: 'Лесные ягоды', tags: 'ягоды,кислый,сладкий,лето', strength: 4 },
    { brand: 'Bliss', name: 'Вишневый пирог', tags: 'ягоды,десерты,выпечка,сладкий,зима', strength: 4 },
    { brand: 'Iron Bro', name: 'Ореховый латте', tags: 'десерты,орехи,напитки,согревающий,зима', strength: 6 },
    { brand: 'Virginia', name: 'Яблоко', tags: 'фрукты,яблоко,сладкий,кислый,классика', strength: 2 },
    { brand: 'The Hatters', name: 'Ягодный микс', tags: 'ягоды,яркий,вечеринка,кислый,сладкий', strength: 5 },
    { brand: 'JENT', name: 'Шоколад с мятой', tags: 'десерты,шоколад,мята,прохлада,вечер', strength: 5 },
    { brand: 'Deus', name: 'Табачный дым', tags: 'табачные,дымный,дерево,крепкий,вечер', strength: 8 },
    { brand: 'Северный', name: 'Смородина лёд', tags: 'ягоды,смородина,кислый,прохлада,лето', strength: 6 },
    { brand: 'Sapphire', name: 'Персик абрикос', tags: 'фрукты,косточковые,сладкий,лето', strength: 3 },
    { brand: 'Element', name: 'Холодный цитрус', tags: 'фрукты,цитрус,прохлада,кислый,лето', strength: 5 },
    { brand: 'Trofimoff`s', name: 'Крем-брюле', tags: 'десерты,сливочный,сладкий,зима', strength: 4 },
    { brand: 'Bonche', name: 'Миндаль корица', tags: 'орехи,пряности,теплый,зима', strength: 7 },
    { brand: 'Notes', name: 'Жасминовый чай', tags: 'травы,цветы,чай,расслабляющий,вечер', strength: 3 }
  ];

  for (const t of tobaccos) {
    await run(
      db,
      'INSERT INTO tobaccos (brand, name, tags, strength) VALUES (?, ?, ?, ?)',
      [t.brand, t.name, t.tags, t.strength]
    );
  }

  // Простейший генератор ~100 миксов на основе табаков
  const bowls = ['турка', 'убивашка', 'ST', 'UPG'];
  const heats = ['хорошо держит жар', 'средняя теплостойкость', 'капризный к жару'];
  const seasons = ['лето', 'зима', 'вечеринка', 'вечер'];
  const complexities = ['простой', 'средний', 'сложный'];

  const allTobaccos = await all(db, 'SELECT * FROM tobaccos');

  let mixIndex = 1;
  for (let i = 0; i < allTobaccos.length; i++) {
    for (let j = i + 1; j < allTobaccos.length && mixIndex <= 100; j++) {
      const t1 = allTobaccos[i];
      const t2 = allTobaccos[j];
      const name = `Микс #${mixIndex}: ${t1.name} + ${t2.name}`;
      const avgStrength = Math.round((t1.strength + t2.strength) / 2);
      const bowl = bowls[mixIndex % bowls.length];
      const heat = heats[mixIndex % heats.length];
      const season = seasons[mixIndex % seasons.length];
      const complexity = complexities[1]; // 2-ингредиентный – средний, но можно считать простым

      const desc = `Комбинация вкусов "${t1.brand} – ${t1.name}" и "${t2.brand} – ${t2.name}". Сбалансированный профиль с крепостью ${avgStrength}/10.`;

      const isFeatured = mixIndex === 1 ? 1 : 0;

      const res = await run(
        db,
        `INSERT INTO mixes (name, description, bowl_type, heat_resistance, season, complexity, strength, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, desc, bowl, heat, season, complexity, avgStrength, isFeatured]
      );

      const mixId = res.lastID;
      await run(
        db,
        'INSERT INTO mix_ingredients (mix_id, tobacco_id, percent) VALUES (?, ?, ?)',
        [mixId, t1.id, 50]
      );
      await run(
        db,
        'INSERT INTO mix_ingredients (mix_id, tobacco_id, percent) VALUES (?, ?, ?)',
        [mixId, t2.id, 50]
      );

      mixIndex++;
    }
  }
}

// --- AUTH (простейший токен) ---
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'admin12345689';
const ADMIN_TOKEN = 'simple_admin_token';

function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'];
  if (auth === `Bearer ${ADMIN_TOKEN}`) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// --- API ---

app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body || {};
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN });
  }
  return res.status(401).json({ error: 'Неверный логин или пароль' });
});

// Список фильтров и исходных данных
app.get('/api/filters-data', async (req, res) => {
  try {
    const tobaccos = await all(db, 'SELECT * FROM tobaccos');
    res.json({
      tobaccos,
      flavorProfiles: [
        'фрукты',
        'ягоды',
        'десерты',
        'травы',
        'цветы',
        'напитки',
        'орехи',
        'пряности',
        'табачные'
      ],
      moods: ['кислый', 'сладкий', 'терпкий', 'прохлада'],
      seasons: ['лето', 'зима', 'вечеринка', 'вечер'],
      complexities: ['простой', 'средний', 'сложный']
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Поиск миксов по фильтрам
app.get('/api/mixes', async (req, res) => {
  try {
    const { profile, mood, minStrength, maxStrength, complexity, season } = req.query;

    let sql =
      'SELECT DISTINCT m.* FROM mixes m JOIN mix_ingredients mi ON mi.mix_id = m.id JOIN tobaccos t ON t.id = mi.tobacco_id WHERE 1=1';
    const params = [];

    if (profile) {
      sql += ' AND t.tags LIKE ?';
      params.push(`%${profile}%`);
    }
    if (mood) {
      sql += ' AND t.tags LIKE ?';
      params.push(`%${mood}%`);
    }
    if (season) {
      sql += ' AND m.season = ?';
      params.push(season);
    }
    if (complexity) {
      sql += ' AND m.complexity = ?';
      params.push(complexity);
    }
    if (minStrength) {
      sql += ' AND m.strength >= ?';
      params.push(Number(minStrength));
    }
    if (maxStrength) {
      sql += ' AND m.strength <= ?';
      params.push(Number(maxStrength));
    }

    sql += ' ORDER BY m.id LIMIT 100';

    const mixes = await all(db, sql, params);
    res.json(mixes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить микс с ингредиентами и комментариями
app.get('/api/mixes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const mix = await get(db, 'SELECT * FROM mixes WHERE id = ?', [id]);
    if (!mix) return res.status(404).json({ error: 'Микс не найден' });

    const ingredients = await all(
      db,
      `SELECT mi.percent, t.*
       FROM mix_ingredients mi
       JOIN tobaccos t ON t.id = mi.tobacco_id
       WHERE mi.mix_id = ?`,
      [id]
    );

    const comments = await all(
      db,
      'SELECT * FROM comments WHERE mix_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({ mix, ingredients, comments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Комментарии
app.post('/api/mixes/:id/comments', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст комментария обязателен' });
    }
    await run(db, 'INSERT INTO comments (mix_id, text) VALUES (?, ?)', [id, text.trim()]);
    const comments = await all(
      db,
      'SELECT * FROM comments WHERE mix_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(comments);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Микс дня
app.get('/api/mix-of-the-day', async (req, res) => {
  try {
    const featured = await get(
      db,
      'SELECT * FROM mixes WHERE is_featured = 1 ORDER BY id LIMIT 1'
    );
    if (!featured) return res.status(404).json({ error: 'Нет микса дня' });
    res.json(featured);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Случайный микс
app.get('/api/random-mix', async (req, res) => {
  try {
    const row = await get(db, 'SELECT * FROM mixes ORDER BY RANDOM() LIMIT 1');
    if (!row) return res.status(404).json({ error: 'Миксы не найдены' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание заказа
app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, mixId, customMix } = req.body || {};
    if (!tableNumber) {
      return res.status(400).json({ error: 'Не указан номер стола' });
    }

    const result = await run(
      db,
      'INSERT INTO orders (table_number, mix_id, custom_mix_json, status) VALUES (?, ?, ?, ?)',
      [String(tableNumber), mixId || null, customMix ? JSON.stringify(customMix) : null, 'created']
    );

    const order = await get(db, 'SELECT * FROM orders WHERE id = ?', [result.lastID]);
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статус заказа для клиента (пулинг)
app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await get(db, 'SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ status: order.status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- ADMIN API ---

// Список активных заказов
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await all(
      db,
      `SELECT o.*, m.name as mix_name
       FROM orders o
       LEFT JOIN mixes m ON m.id = o.mix_id
       WHERE o.status != 'done'
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление статуса заказа
app.post('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Статус обязателен' });
    await run(db, 'UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    const order = await get(db, 'SELECT * FROM orders WHERE id = ?', [id]);
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Завершить заказ
app.post('/api/admin/orders/:id/done', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await run(db, 'UPDATE orders SET status = ? WHERE id = ?', ['done', id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Hookach server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB init error', err);
    process.exit(1);
  });

