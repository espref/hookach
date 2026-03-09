// Режим работы:
// true  – полностью статичный режим для GitHub Pages (всё хранится в localStorage)
// false – работа через реальный backend по API_BASE
const USE_MOCK = false;
const API_BASE = 'https://hookach-render.onrender.com'; // например, https://hookach-backend.onrender.com

let api;

// ---------- MOCK API ДЛЯ GITHUB PAGES ----------
if (USE_MOCK) {
  const LS_KEY = 'hookach_mock_state_v1';

  function loadState() {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      // игнор
    }
  }

  function initMockData() {
    let state = loadState();
    if (state) return state;

    const tobaccos = [
      { id: 1, brand: 'Blackburn', name: 'Малина лимонад', tags: 'фрукты,ягоды,лимонад,кислый,сладкий,лето', strength: 4 },
      { id: 2, brand: 'Blackburn', name: 'Грейпфрут', tags: 'фрукты,цитрус,кислый,терпкий,лето', strength: 5 },
      { id: 3, brand: 'Overdose', name: 'Энерджи', tags: 'напитки,энергетик,сладкий,вечеринка', strength: 7 },
      { id: 4, brand: 'Banger', name: 'Лимонный пирог', tags: 'десерты,выпечка,лимон,сладкий,зима', strength: 5 },
      { id: 5, brand: 'NАШ', name: 'Чай с бергамотом', tags: 'напитки,чай,цитрус,вечер,расслабляющий', strength: 3 },
      { id: 6, brand: 'Sebero', name: 'Клубника мята', tags: 'ягоды,мята,прохлада,сладкий,лето', strength: 4 },
      { id: 7, brand: 'Chabacco', name: 'Тархун', tags: 'травы,напитки,тархун,сладкий,лето', strength: 3 },
      { id: 8, brand: 'Spectrum', name: 'Лесные ягоды', tags: 'ягоды,кислый,сладкий,лето', strength: 4 },
      { id: 9, brand: 'Bliss', name: 'Вишневый пирог', tags: 'ягоды,десерты,выпечка,сладкий,зима', strength: 4 },
      { id: 10, brand: 'Iron Bro', name: 'Ореховый латте', tags: 'десерты,орехи,напитки,согревающий,зима', strength: 6 },
      { id: 11, brand: 'Virginia', name: 'Яблоко', tags: 'фрукты,яблоко,сладкий,кислый,классика', strength: 2 },
      { id: 12, brand: 'The Hatters', name: 'Ягодный микс', tags: 'ягоды,яркий,вечеринка,кислый,сладкий', strength: 5 },
      { id: 13, brand: 'JENT', name: 'Шоколад с мятой', tags: 'десерты,шоколад,мята,прохлада,вечер', strength: 5 },
      { id: 14, brand: 'Deus', name: 'Табачный дым', tags: 'табачные,дымный,дерево,крепкий,вечер', strength: 8 },
      { id: 15, brand: 'Северный', name: 'Смородина лёд', tags: 'ягоды,смородина,кислый,прохлада,лето', strength: 6 },
      { id: 16, brand: 'Sapphire', name: 'Персик абрикос', tags: 'фрукты,косточковые,сладкий,лето', strength: 3 },
      { id: 17, brand: 'Element', name: 'Холодный цитрус', tags: 'фрукты,цитрус,прохлада,кислый,лето', strength: 5 },
      { id: 18, brand: 'Trofimoff`s', name: 'Крем-брюле', tags: 'десерты,сливочный,сладкий,зима', strength: 4 },
      { id: 19, brand: 'Bonche', name: 'Миндаль корица', tags: 'орехи,пряности,теплый,зима', strength: 7 },
      { id: 20, brand: 'Notes', name: 'Жасминовый чай', tags: 'травы,цветы,чай,расслабляющий,вечер', strength: 3 }
    ];

    const bowls = ['турка', 'убивашка', 'ST', 'UPG'];
    const heats = ['хорошо держит жар', 'средняя теплостойкость', 'капризный к жару'];
    const seasons = ['лето', 'зима', 'вечеринка', 'вечер'];
    const complexities = ['простой', 'средний', 'сложный'];

    const mixes = [];
    const mixIngredients = [];

    let mixId = 1;
    for (let i = 0; i < tobaccos.length && mixId <= 40; i++) {
      for (let j = i + 1; j < tobaccos.length && mixId <= 40; j++) {
        const t1 = tobaccos[i];
        const t2 = tobaccos[j];
        const avgStrength = Math.round((t1.strength + t2.strength) / 2);
        mixes.push({
          id: mixId,
          name: `Микс #${mixId}: ${t1.name} + ${t2.name}`,
          description: `Комбинация вкусов "${t1.brand} – ${t1.name}" и "${t2.brand} – ${t2.name}". Сбалансированный профиль с крепостью ${avgStrength}/10.`,
          bowl_type: bowls[mixId % bowls.length],
          heat_resistance: heats[mixId % heats.length],
          season: seasons[mixId % seasons.length],
          complexity: complexities[1],
          strength: avgStrength,
          is_featured: mixId === 1 ? 1 : 0
        });
        mixIngredients.push(
          { mix_id: mixId, tobacco_id: t1.id, percent: 50 },
          { mix_id: mixId, tobacco_id: t2.id, percent: 50 }
        );
        mixId++;
      }
    }

    state = {
      tobaccos,
      mixes,
      mixIngredients,
      comments: {}, // { [mixId]: [{id,text,created_at}] }
      orders: [], // {id, table_number, mix_id, status, created_at, coal_started_at, coal_changes}
      lastOrderId: 0
    };
    saveState(state);
    return state;
  }

  function getState() {
    return initMockData();
  }

  api = {
    async getFilters() {
      const state = getState();
      return {
        tobaccos: state.tobaccos,
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
      };
    },
    async getMixes(params) {
      const state = getState();
      let result = [...state.mixes];
      const { profile, mood, season, complexity, minStrength, maxStrength } = params || {};

      if (season) result = result.filter((m) => m.season === season);
      if (complexity) result = result.filter((m) => m.complexity === complexity);
      if (minStrength) result = result.filter((m) => m.strength >= Number(minStrength));
      if (maxStrength) result = result.filter((m) => m.strength <= Number(maxStrength));

      if (profile || mood) {
        result = result.filter((m) => {
          const ing = state.mixIngredients.filter((mi) => mi.mix_id === m.id);
          const tags = ing
            .map((mi) => state.tobaccos.find((t) => t.id === mi.tobacco_id)?.tags || '')
            .join(',')
            .toLowerCase();
          if (profile && !tags.includes(profile.toLowerCase())) return false;
          if (mood && !tags.includes(mood.toLowerCase())) return false;
          return true;
        });
      }

      return result.slice(0, 100);
    },
    async getMix(id) {
      const state = getState();
      const mix = state.mixes.find((m) => m.id === Number(id));
      if (!mix) throw new Error('Микс не найден');
      const ingredients = state.mixIngredients
        .filter((mi) => mi.mix_id === mix.id)
        .map((mi) => {
          const t = state.tobaccos.find((tt) => tt.id === mi.tobacco_id);
          return {
            ...t,
            percent: mi.percent
          };
        });
      const comments = state.comments[mix.id] || [];
      return { mix, ingredients, comments };
    },
    async getMixOfDay() {
      const state = getState();
      const featured = state.mixes.find((m) => m.is_featured === 1) || state.mixes[0];
      if (!featured) throw new Error('Нет микса дня');
      return featured;
    },
    async getRandomMix() {
      const state = getState();
      if (!state.mixes.length) throw new Error('Нет случайного микса');
      const idx = Math.floor(Math.random() * state.mixes.length);
      return state.mixes[idx];
    },
    async postComment(mixId, text) {
      const state = getState();
      const id = Date.now();
      const c = {
        id,
        text,
        created_at: new Date().toISOString()
      };
      if (!state.comments[mixId]) state.comments[mixId] = [];
      state.comments[mixId].unshift(c);
      saveState(state);
      return state.comments[mixId];
    },
    async createOrder(payload) {
      const state = getState();
      const id = state.lastOrderId + 1;
      const order = {
        id,
        table_number: String(payload.tableNumber),
        mix_id: payload.mixId || null,
        status: 'created',
        created_at: new Date().toISOString()
      };
      state.lastOrderId = id;
      state.orders.unshift(order);
      saveState(state);
      return order;
    },
    async getOrderStatus(id) {
      const state = getState();
      const order = state.orders.find((o) => o.id === Number(id));
      if (!order) throw new Error('Заказ не найден');
      const coalChanges = order.coal_changes || 0;
      let coalSecondsLeft = null;
      let requireBowlChange = coalChanges >= 3;
      if (order.coal_started_at && !requireBowlChange) {
        const start = new Date(order.coal_started_at).getTime();
        const now = Date.now();
        const passed = Math.max(0, Math.floor((now - start) / 1000));
        coalSecondsLeft = Math.max(0, 20 * 60 - passed);
      } else if (requireBowlChange) {
        coalSecondsLeft = 0;
      }
      return { status: order.status, coalSecondsLeft, coalChanges, requireBowlChange };
    },
    async adminLogin(login, password) {
      if (login === 'admin' && password === 'admin12345689') {
        return { token: 'mock_admin_token' };
      }
      throw new Error('Неверный логин или пароль');
    },
    async adminGetOrders(token) {
      if (token !== 'mock_admin_token') throw new Error('unauthorized');
      const state = getState();
      return state.orders
        .filter((o) => o.status !== 'done')
        .map((o) => {
          const coalChanges = o.coal_changes || 0;
          let coalSecondsLeft = null;
          let requireBowlChange = coalChanges >= 3;
          if (o.coal_started_at && !requireBowlChange) {
            const start = new Date(o.coal_started_at).getTime();
            const now = Date.now();
            const passed = Math.max(0, Math.floor((now - start) / 1000));
            coalSecondsLeft = Math.max(0, 20 * 60 - passed);
          } else if (requireBowlChange) {
            coalSecondsLeft = 0;
          }
          return {
            ...o,
            mix_name:
              o.mix_id && state.mixes.find((m) => m.id === o.mix_id)?.name
                ? state.mixes.find((m) => m.id === o.mix_id).name
                : 'Авторский заказ (кастомный микс)',
            coalSecondsLeft,
            coalChanges,
            requireBowlChange
          };
        });
    },
    async adminSetStatus(id, status, token) {
      if (token !== 'mock_admin_token') throw new Error('unauthorized');
      const state = getState();
      const order = state.orders.find((o) => o.id === Number(id));
      if (!order) throw new Error('Заказ не найден');
      order.status = status;
      if (status === 'heating') {
        order.coal_started_at = new Date().toISOString();
        order.coal_changes = order.coal_changes || 0;
      }
      saveState(state);
      return order;
    },
    async adminDone(id, token) {
      if (token !== 'mock_admin_token') throw new Error('unauthorized');
      const state = getState();
      const order = state.orders.find((o) => o.id === Number(id));
      if (!order) throw new Error('Заказ не найден');
      order.status = 'done';
      saveState(state);
      return { ok: true };
    }
  };
} else {
  // ---------- РЕЖИМ С РЕАЛЬНЫМ BACKEND ----------
  api = {
    async getFilters() {
      const res = await fetch(`${API_BASE}/api/filters-data`);
      if (!res.ok) throw new Error('Ошибка загрузки фильтров');
      return res.json();
    },
    async getMixes(params) {
      const url = new URL(`${API_BASE}/api/mixes`);
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, v);
      });
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Ошибка загрузки миксов');
      return res.json();
    },
    async getMix(id) {
      const res = await fetch(`${API_BASE}/api/mixes/${id}`);
      if (!res.ok) throw new Error('Микс не найден');
      return res.json();
    },
    async getMixOfDay() {
      const res = await fetch(`${API_BASE}/api/mix-of-the-day`);
      if (!res.ok) throw new Error('Нет микса дня');
      return res.json();
    },
    async getRandomMix() {
      const res = await fetch(`${API_BASE}/api/random-mix`);
      if (!res.ok) throw new Error('Нет случайного микса');
      return res.json();
    },
    async postComment(mixId, text) {
      const res = await fetch(`${API_BASE}/api/mixes/${mixId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Ошибка добавления комментария');
      return res.json();
    },
    async createOrder(payload) {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Ошибка создания заказа');
      return res.json();
    },
    async getOrderStatus(id) {
      const res = await fetch(`${API_BASE}/api/orders/${id}/status`);
      if (!res.ok) throw new Error('Ошибка статуса заказа');
      return res.json();
    },
    async adminLogin(login, password) {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      if (!res.ok) throw new Error('Неверный логин или пароль');
      return res.json();
    },
    async adminGetOrders(token) {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка загрузки заказов');
      return res.json();
    },
    async adminSetStatus(id, status, token) {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Ошибка обновления статуса');
      return res.json();
    },
    async adminDone(id, token) {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/done`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка завершения заказа');
      return res.json();
    },
    async adminCoalChange(id, token) {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/coal-change`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка смены углей');
      return res.json();
    },
    async adminRandomMix(token) {
      const res = await fetch(`${API_BASE}/api/admin/mix-of-the-day/random`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка рандома микса дня');
      return res.json();
    }
  };
}

let globalState = {
  tobaccos: [],
  filters: null,
  currentMix: null,
  currentOrderId: null,
  orderPollTimer: null,
  adminToken: null
};

function $(id) {
  return document.getElementById(id);
}

function createTag(label, value, onChange) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'tag';
  el.textContent = label;
  el.dataset.value = value;
  el.addEventListener('click', () => {
    el.classList.toggle('selected');
    onChange();
  });
  return el;
}

function getSelectedValues(container) {
  return Array.from(container.querySelectorAll('.tag.selected')).map(
    (el) => el.dataset.value
  );
}

function clampStrengthInput() {
  const minEl = $('strengthMin');
  const maxEl = $('strengthMax');
  let min = parseInt(minEl.value || '1', 10);
  let max = parseInt(maxEl.value || '10', 10);
  if (isNaN(min) || min < 1) min = 1;
  if (isNaN(max) || max > 10) max = 10;
  if (min > max) min = max;
  minEl.value = String(min);
  maxEl.value = String(max);
}

function strengthLabel(v) {
  if (v <= 3) return { text: 'Лёгкий', cls: 'light' };
  if (v <= 7) return { text: 'Средний', cls: 'medium' };
  return { text: 'Крепкий', cls: 'strong' };
}

function renderFilters(data) {
  globalState.tobaccos = data.tobaccos;
  globalState.filters = data;

  const profileWrap = $('profileFilters');
  const moodWrap = $('moodFilters');
  const seasonWrap = $('seasonFilters');
  const complexityWrap = $('complexityFilters');

  const invalidate = () => {};

  data.flavorProfiles.forEach((p) =>
    profileWrap.appendChild(createTag(p, p, invalidate))
  );
  data.moods.forEach((m) => moodWrap.appendChild(createTag(m, m, invalidate)));
  data.seasons.forEach((s) =>
    seasonWrap.appendChild(createTag(s, s, invalidate))
  );
  data.complexities.forEach((c) =>
    complexityWrap.appendChild(createTag(c, c, invalidate))
  );
}

function renderMixOfDay(mix) {
  const wrap = $('mixOfDay');
  if (!mix) {
    wrap.textContent = 'Микс дня пока не выбран.';
    return;
  }
  wrap.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'mix-title';
  title.textContent = mix.name;

  const meta = document.createElement('div');
  meta.className = 'mix-meta';
  const strong = strengthLabel(mix.strength || 5);
  meta.innerHTML = `Крепость: ${mix.strength || '?'} / 10 · <span class="pill ${strong.cls}">${strong.text}</span> · Чаша: ${
    mix.bowl_type || 'любая'
  }`;

  const desc = document.createElement('div');
  desc.className = 'mix-desc';
  desc.textContent = mix.description || 'Авторский микс для этого дня.';

  const btn = document.createElement('button');
  btn.className = 'btn ghost small';
  btn.textContent = 'Подробнее и заказать';
  btn.addEventListener('click', () => openMixModal(mix.id));

  wrap.appendChild(title);
  wrap.appendChild(meta);
  wrap.appendChild(desc);
  wrap.appendChild(btn);
}

function renderMixList(mixes) {
  const list = $('mixList');
  list.innerHTML = '';
  if (!mixes || mixes.length === 0) {
    list.classList.add('empty-placeholder');
    list.textContent = 'По вашим фильтрам ничего не найдено. Попробуйте ослабить условия.';
    return;
  }
  list.classList.remove('empty-placeholder');

  mixes.forEach((mix) => {
    const card = document.createElement('div');
    card.className = 'mix-card';

    const header = document.createElement('div');
    header.className = 'mix-card-header';

    const title = document.createElement('div');
    title.className = 'mix-card-title';
    title.textContent = mix.name;

    const pillEl = document.createElement('span');
    const sl = strengthLabel(mix.strength || 5);
    pillEl.className = `pill ${sl.cls}`;
    pillEl.textContent = `${sl.text} · ${mix.strength || '?'} / 10`;

    header.appendChild(title);
    header.appendChild(pillEl);

    const meta = document.createElement('div');
    meta.className = 'mix-card-meta';
    meta.innerHTML = `<span>Чаша: ${mix.bowl_type || 'любая'}</span><span>Сезон: ${
      mix.season || 'любой'
    }</span><span>Сложность: ${mix.complexity || '?'}</span>`;

    const actions = document.createElement('div');
    actions.className = 'mix-card-actions';

    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'btn ghost small';
    detailsBtn.textContent = 'Подробнее';
    detailsBtn.addEventListener('click', () => openMixModal(mix.id));

    const orderBtn = document.createElement('button');
    orderBtn.className = 'btn primary small';
    orderBtn.textContent = 'Выбрать и заказать';
    orderBtn.addEventListener('click', () => openMixModal(mix.id, true));

    actions.appendChild(detailsBtn);
    actions.appendChild(orderBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actions);

    list.appendChild(card);
  });
}

function openModal(el) {
  el.classList.remove('hidden');
}

function closeModal(el) {
  el.classList.add('hidden');
}

async function openMixModal(id, scrollToOrder = false) {
  try {
    const data = await api.getMix(id);
    globalState.currentMix = data;
    const body = $('mixModalBody');
    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'mix-modal-header';
    const title = document.createElement('h2');
    title.className = 'mix-modal-title';
    title.textContent = data.mix.name;
    const meta = document.createElement('div');
    meta.className = 'mix-modal-meta';
    const sl = strengthLabel(data.mix.strength || 5);
    meta.innerHTML = `<span>Крепость: ${data.mix.strength || '?'} / 10</span>
      <span class="pill ${sl.cls}">${sl.text}</span>
      <span>Чаша: ${data.mix.bowl_type || 'любая'}</span>
      <span>Теплостойкость: ${data.mix.heat_resistance || 'средняя'}</span>
      <span>Сезон: ${data.mix.season || 'любой'}</span>`;
    header.appendChild(title);
    header.appendChild(meta);

    const grid = document.createElement('div');
    grid.className = 'mix-modal-grid';

    const left = document.createElement('div');
    const ingTitle = document.createElement('h3');
    ingTitle.className = 'mix-section-title';
    ingTitle.textContent = 'Пропорции и табаки';
    const ul = document.createElement('ul');
    ul.className = 'ingredients-list';

    data.ingredients.forEach((ing) => {
      const li = document.createElement('li');
      li.className = 'ingredient-row';
      const leftCol = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'ingredient-name';
      name.textContent = `${ing.name} — ${ing.percent}%`;
      const brand = document.createElement('div');
      brand.className = 'ingredient-brand';
      brand.textContent = ing.brand;
      leftCol.appendChild(name);
      leftCol.appendChild(brand);
      const rightCol = document.createElement('div');
      rightCol.textContent = '';
      li.appendChild(leftCol);
      li.appendChild(rightCol);
      ul.appendChild(li);
    });

    const replBlock = document.createElement('div');
    replBlock.className = 'ingredient-actions';
    replBlock.textContent =
      'Нет какого-то табака? Выберите замену с похожим профилем — мы увидим это в заказе.';

    const replList = document.createElement('div');
    replList.className = 'replacement-list';

    data.ingredients.forEach((ing) => {
      const tokens = (ing.tags || '').split(',').map((t) => t.trim());
      const mainTag = tokens[0];
      const alternatives = globalState.tobaccos.filter(
        (t) =>
          t.id !== ing.id &&
          t.tags.toLowerCase().includes((mainTag || '').toLowerCase())
      );
      const alt = alternatives.slice(0, 2);
      alt.forEach((a) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'replacement-pill';
        pill.textContent = `Вместо ${ing.name}: ${a.brand} — ${a.name}`;
        pill.addEventListener('click', () => {
          pill.classList.toggle('selected');
          pill.dataset.replaceFor = String(ing.id);
          pill.dataset.replaceWith = String(a.id);
        });
        replList.appendChild(pill);
      });
    });

    replBlock.appendChild(replList);

    left.appendChild(ingTitle);
    left.appendChild(ul);
    left.appendChild(replBlock);

    const right = document.createElement('div');
    const descTitle = document.createElement('h3');
    descTitle.className = 'mix-section-title';
    descTitle.textContent = 'Описание вкуса';
    const desc = document.createElement('p');
    desc.style.fontSize = '13px';
    desc.style.marginTop = '2px';
    desc.textContent =
      data.mix.description ||
      'Сначала раскрываются верхние ноты, затем вкус становится глубже и мягче.';

    const bowlTitle = document.createElement('h3');
    bowlTitle.className = 'mix-section-title';
    bowlTitle.textContent = 'Рекомендация по чаше';
    const bowlText = document.createElement('p');
    bowlText.style.fontSize = '13px';
    bowlText.textContent = data.mix.bowl_type
      ? `Лучше всего раскрывается на чаше типа ${data.mix.bowl_type}.`
      : 'Подойдёт любая классическая чаша.';

    const orderTitle = document.createElement('h3');
    orderTitle.className = 'mix-section-title';
    orderTitle.textContent = 'Заказ для вашего стола';

    const orderHint = document.createElement('p');
    orderHint.style.fontSize = '12px';
    orderHint.style.color = '#8b8fa1';
    orderHint.textContent =
      'Убедитесь, что указан номер стола вверху страницы. Мы увидим ваш выбор и начнём готовку.';

    const tableField = document.createElement('div');
    tableField.className = 'form-field';
    const tableLabel = document.createElement('label');
    tableLabel.textContent = 'Номер стола';
    const tableInput = document.createElement('input');
    tableInput.type = 'text';
    tableInput.placeholder = 'Например: 5';
    tableInput.value = ($('tableNumber') && $('tableNumber').value) || '';
    tableInput.addEventListener('input', () => {
      if ($('tableNumber')) $('tableNumber').value = tableInput.value;
    });
    tableField.appendChild(tableLabel);
    tableField.appendChild(tableInput);

    const orderBtn = document.createElement('button');
    orderBtn.className = 'btn primary full';
    orderBtn.textContent = 'Отправить заказ на этот микс';
    orderBtn.addEventListener('click', () => submitOrderFromModal());

    right.appendChild(descTitle);
    right.appendChild(desc);
    right.appendChild(bowlTitle);
    right.appendChild(bowlText);
    right.appendChild(orderTitle);
    right.appendChild(orderHint);
    right.appendChild(tableField);
    right.appendChild(orderBtn);

    grid.appendChild(left);
    grid.appendChild(right);

    const commentsBlock = document.createElement('div');
    commentsBlock.className = 'comments-block';

    const commentsTitle = document.createElement('h3');
    commentsTitle.className = 'mix-section-title';
    commentsTitle.textContent = 'Отзывы о миксе';

    const commentsList = document.createElement('div');
    commentsList.className = 'comments-list';

    if (!data.comments || data.comments.length === 0) {
      const empty = document.createElement('div');
      empty.style.fontSize = '12px';
      empty.style.color = '#8b8fa1';
      empty.textContent = 'Пока нет комментариев. Будьте первым!';
      commentsList.appendChild(empty);
    } else {
      data.comments.forEach((c) => {
        commentsList.appendChild(renderComment(c));
      });
    }

    const form = document.createElement('form');
    form.className = 'comment-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Оставьте короткий отзыв...';
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'btn small ghost';
    btn.textContent = 'Отправить';
    form.appendChild(input);
    form.appendChild(btn);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      try {
        const comments = await api.postComment(data.mix.id, text);
        commentsList.innerHTML = '';
        comments.forEach((c) => commentsList.appendChild(renderComment(c)));
        input.value = '';
      } catch (err) {
        alert(err.message || 'Ошибка отправки комментария');
      }
    });

    commentsBlock.appendChild(commentsTitle);
    commentsBlock.appendChild(commentsList);
    commentsBlock.appendChild(form);

    body.appendChild(header);
    body.appendChild(grid);
    body.appendChild(commentsBlock);

    openModal($('mixModal'));
    if (scrollToOrder) {
      setTimeout(() => {
        right.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  } catch (err) {
    alert(err.message || 'Ошибка загрузки микса');
  }
}

function renderComment(c) {
  const wrap = document.createElement('div');
  wrap.className = 'comment';
  const text = document.createElement('div');
  text.textContent = c.text;
  const date = document.createElement('div');
  date.className = 'comment-date';
  date.textContent = new Date(c.created_at).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
  wrap.appendChild(text);
  wrap.appendChild(date);
  return wrap;
}

async function submitOrderFromModal() {
  const tableNumber = $('tableNumber').value.trim();
  if (!tableNumber) {
    alert('Пожалуйста, введите номер вашего стола наверху страницы.');
    return;
  }
  if (!globalState.currentMix) return;

  try {
    const order = await api.createOrder({
      tableNumber,
      mixId: globalState.currentMix.mix.id,
      customMix: null
    });
    globalState.currentOrderId = order.id;
    startOrderPolling(order.id);
    closeModal($('mixModal'));
    updateOrderStatus(order.status, {
      coalSecondsLeft: null,
      coalChanges: 0,
      requireBowlChange: false
    });
  } catch (err) {
    alert(err.message || 'Ошибка создания заказа');
  }
}

function updateOrderStatus(status, extra) {
  const section = $('orderStatusSection');
  const textEl = $('orderStatusText');
  const coalsEl = $('coalsTimerText');
  section.hidden = false;
  let label = '';
  let explanation = '';
  let cls = '';
  if (status === 'created') {
    label = 'Заказ принят';
    explanation = 'Мы получили ваш выбор и скоро начнём готовить чашу.';
    cls = 'status-created';
  } else if (status === 'preparing') {
    label = 'Готовка чаши';
    explanation = 'Кальянщик формирует чашу и подбирает угли.';
    cls = 'status-preparing';
  } else if (status === 'heating') {
    label = 'Кальян нагревается';
    explanation = 'Кальян стоит на прогреве — скоро принесём к вашему столу.';
    cls = 'status-heating';
  } else if (status === 'done') {
    label = 'Заказ завершён';
    explanation = 'Кальян уже у вас. Приятного отдыха!';
    cls = 'status-heating';
  } else {
    label = status;
    explanation = '';
  }
  textEl.innerHTML = `<span class="status-label ${cls}">${label}</span>${
    explanation ? ' — ' + explanation : ''
  }`;

  if (coalsEl) {
    if (!extra || extra.coalSecondsLeft == null) {
      coalsEl.textContent = '';
    } else {
      const left = extra.coalSecondsLeft;
      const changes = extra.coalChanges || 0;
      const requireBowl = extra.requireBowlChange;
      if (requireBowl) {
        coalsEl.textContent = 'Лимит смен углей исчерпан. Требуется замена чаши.';
      } else if (left <= 0) {
        coalsEl.textContent = 'Кальянщик уже должен подойти для смены углей.';
      } else {
        const mins = Math.floor(left / 60);
        const secs = left % 60;
        coalsEl.textContent = `До смены углей примерно ${mins} мин ${secs
          .toString()
          .padStart(2, '0')} сек. Смен выполнено: ${changes}.`;
      }
    }
  }
}

function startOrderPolling(id) {
  if (globalState.orderPollTimer) {
    clearInterval(globalState.orderPollTimer);
  }
  globalState.orderPollTimer = setInterval(async () => {
    try {
      const data = await api.getOrderStatus(id);
      updateOrderStatus(data.status, data);
      if (data.status === 'done') {
        clearInterval(globalState.orderPollTimer);
      }
    } catch {
      // игнорируем временные ошибки
    }
  }, 4000);
}

function loadAdminToken() {
  const t = window.localStorage.getItem('hookach_admin_token');
  if (t) {
    globalState.adminToken = t;
    showAdminPanel();
    refreshAdminOrders();
  }
}

function saveAdminToken(token) {
  globalState.adminToken = token;
  window.localStorage.setItem('hookach_admin_token', token);
}

function clearAdminToken() {
  globalState.adminToken = null;
  window.localStorage.removeItem('hookach_admin_token');
}

async function handleAdminLogin() {
  const login = $('adminLogin').value.trim();
  const password = $('adminPassword').value;
  const errEl = $('adminLoginError');
  errEl.textContent = '';
  try {
    const res = await api.adminLogin(login, password);
    saveAdminToken(res.token);
    closeModal($('adminModal'));
    showAdminPanel();
    refreshAdminOrders();
  } catch (err) {
    errEl.textContent = err.message || 'Ошибка входа';
  }
}

function showAdminPanel() {
  $('adminPanel').classList.remove('hidden');
}

function hideAdminPanel() {
  $('adminPanel').classList.add('hidden');
}

async function refreshAdminOrders() {
  if (!globalState.adminToken) return;
  try {
    const orders = await api.adminGetOrders(globalState.adminToken);
    const wrap = $('adminOrders');
    wrap.innerHTML = '';
    if (!orders || orders.length === 0) {
      const empty = document.createElement('div');
      empty.style.fontSize = '12px';
      empty.style.color = '#8b8fa1';
      empty.textContent = 'Активных заказов нет.';
      wrap.appendChild(empty);
      return;
    }
    orders.forEach((o) => {
      wrap.appendChild(renderAdminOrder(o));
    });
  } catch (err) {
    $('adminOrders').innerHTML =
      '<div style="font-size:12px;color:#ff4d4f;">Ошибка загрузки заказов. Возможно, сессия устарела.</div>';
  }
}

function renderAdminOrder(o) {
  const card = document.createElement('div');
  card.className = 'admin-order-card';
  if (o.coalSecondsLeft != null && o.coalSecondsLeft <= 4 * 60 && o.coalSecondsLeft > 0 && !o.requireBowlChange) {
    card.classList.add('coals-warning');
  }
  const header = document.createElement('div');
  header.className = 'admin-order-header';
  const title = document.createElement('div');
  title.innerHTML = `<strong>Стол ${o.table_number}</strong>`;
  const status = document.createElement('div');
  status.style.fontSize = '11px';
  status.textContent = `Статус: ${o.status}`;
  header.appendChild(title);
  header.appendChild(status);

  const mixName = document.createElement('div');
  mixName.style.marginTop = '4px';
  mixName.textContent = o.mix_name || 'Авторский заказ (кастомный микс)';

  const time = document.createElement('div');
  time.style.fontSize = '11px';
  time.style.color = '#8b8fa1';
  time.textContent = new Date(o.created_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const coalsInfo = document.createElement('div');
  coalsInfo.style.fontSize = '11px';
  coalsInfo.style.marginTop = '2px';
  if (o.coalSecondsLeft == null) {
    coalsInfo.textContent = `Таймер углей: нет (ещё не на прогреве). Смен: ${o.coalChanges || 0}.`;
  } else if (o.requireBowlChange) {
    coalsInfo.textContent = `Таймер углей: лимит смен исчерпан, требуется замена чаши. Смен: ${o.coalChanges || 0}.`;
  } else {
    const mins = Math.floor(o.coalSecondsLeft / 60);
    const secs = o.coalSecondsLeft % 60;
    coalsInfo.textContent = `Таймер углей: ${mins} мин ${secs
      .toString()
      .padStart(2, '0')} сек. Смен: ${o.coalChanges || 0}.`;
  }

  const actions = document.createElement('div');
  actions.className = 'admin-order-actions';

  const btnPreparing = document.createElement('button');
  btnPreparing.className = 'btn small ghost';
  btnPreparing.textContent = 'Готовка чаши';
  btnPreparing.addEventListener('click', async () => {
    try {
      await api.adminSetStatus(o.id, 'preparing', globalState.adminToken);
      await refreshAdminOrders();
    } catch {
      alert('Ошибка обновления статуса');
    }
  });

  const btnHeating = document.createElement('button');
  btnHeating.className = 'btn small primary';
  btnHeating.textContent = 'Кальян нагревается';
  btnHeating.addEventListener('click', async () => {
    try {
      await api.adminSetStatus(o.id, 'heating', globalState.adminToken);
      await refreshAdminOrders();
    } catch {
      alert('Ошибка обновления статуса');
    }
  });

  const btnDone = document.createElement('button');
  btnDone.className = 'btn small ghost';
  btnDone.textContent = 'Гости ушли';
  btnDone.addEventListener('click', async () => {
    try {
      await api.adminDone(o.id, globalState.adminToken);
      await refreshAdminOrders();
    } catch {
      alert('Ошибка завершения заказа');
    }
  });

  const btnMixDetails = document.createElement('button');
  btnMixDetails.className = 'btn small ghost';
  btnMixDetails.textContent = 'Открыть микс';
  btnMixDetails.disabled = !o.mix_id;
  btnMixDetails.addEventListener('click', () => {
    if (o.mix_id) openMixModal(o.mix_id, false);
  });

  const btnCoalChange = document.createElement('button');
  btnCoalChange.className = 'btn small ghost';
  btnCoalChange.textContent = 'Смена углей';
  if (o.requireBowlChange) {
    btnCoalChange.disabled = true;
    btnCoalChange.title = 'Требуется замена чаши';
  }
  btnCoalChange.addEventListener('click', async () => {
    try {
      const updated = await api.adminCoalChange(o.id, globalState.adminToken);
      if (updated.requireBowlChange) {
        alert('Требуется замена чаши — лимит смен углей исчерпан.');
      }
      await refreshAdminOrders();
    } catch (err) {
      alert(err.message || 'Ошибка смены углей');
    }
  });

  actions.appendChild(btnPreparing);
  actions.appendChild(btnHeating);
  actions.appendChild(btnCoalChange);
  actions.appendChild(btnMixDetails);
  actions.appendChild(btnDone);

  card.appendChild(header);
  card.appendChild(mixName);
  card.appendChild(time);
  card.appendChild(coalsInfo);
  card.appendChild(actions);
  return card;
}

function initModals() {
  document.body.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('[data-close-modal]')) {
      closeModal($('mixModal'));
      closeModal($('adminModal'));
    }
  });
}

async function initApp() {
  try {
    const data = await api.getFilters();
    renderFilters(data);
  } catch (err) {
    alert(err.message || 'Ошибка инициализации фильтров');
  }

  try {
    const mix = await api.getMixOfDay();
    renderMixOfDay(mix);
  } catch {
    renderMixOfDay(null);
  }

  $('applyFilters').addEventListener('click', async () => {
    clampStrengthInput();
    const profiles = getSelectedValues($('profileFilters'));
    const moods = getSelectedValues($('moodFilters'));
    const seasons = getSelectedValues($('seasonFilters'));
    const complexities = getSelectedValues($('complexityFilters'));
    const minStrength = $('strengthMin').value;
    const maxStrength = $('strengthMax').value;

    const params = {
      profile: profiles[0],
      mood: moods[0],
      season: seasons[0],
      complexity: complexities[0],
      minStrength,
      maxStrength
    };
    try {
      const mixes = await api.getMixes(params);
      renderMixList(mixes);
    } catch (err) {
      alert(err.message || 'Ошибка поиска миксов');
    }
  });

  $('resetFilters').addEventListener('click', () => {
    ['profileFilters', 'moodFilters', 'seasonFilters', 'complexityFilters'].forEach(
      (id) => {
        $(id)
          .querySelectorAll('.tag.selected')
          .forEach((el) => el.classList.remove('selected'));
      }
    );
    $('strengthMin').value = '1';
    $('strengthMax').value = '10';
    $('mixList').classList.add('empty-placeholder');
    $('mixList').textContent =
      'Выберите фильтры и нажмите «Показать миксы».';
  });

  $('randomMix').addEventListener('click', async () => {
    try {
      const mix = await api.getRandomMix();
      openMixModal(mix.id, true);
    } catch (err) {
      alert(err.message || 'Ошибка выбора случайного микса');
    }
  });

  $('strengthMin').addEventListener('change', clampStrengthInput);
  $('strengthMax').addEventListener('change', clampStrengthInput);

  $('adminLoginBtn').addEventListener('click', handleAdminLogin);
  $('adminLogoutBtn').addEventListener('click', () => {
    clearAdminToken();
    hideAdminPanel();
  });

  const randomBtn = $('adminRandomMixBtn');
  if (randomBtn) {
    randomBtn.addEventListener('click', async () => {
      if (!globalState.adminToken) {
        alert('Сначала войдите в админку.');
        return;
      }
      try {
        await api.adminRandomMix(globalState.adminToken);
        alert('Микс дня обновлён случайным образом.');
        const mix = await api.getMixOfDay();
        renderMixOfDay(mix);
      } catch (err) {
        alert(err.message || 'Ошибка рандома микса дня');
      }
    });
  }

  let triggerClicks = 0;
  const trigger = $('secretAdminTrigger');
  trigger.addEventListener('click', () => {
    triggerClicks += 1;
    if (triggerClicks >= 3) {
      triggerClicks = 0;
      openModal($('adminModal'));
    }
  });

  initModals();
  loadAdminToken();
  if (globalState.currentOrderId) {
    startOrderPolling(globalState.currentOrderId);
  }
}

document.addEventListener('DOMContentLoaded', initApp);

