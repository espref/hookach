const api = {
  async getFilters() {
    const res = await fetch('/api/filters-data');
    if (!res.ok) throw new Error('Ошибка загрузки фильтров');
    return res.json();
  },
  async getMixes(params) {
    const url = new URL('/api/mixes', window.location.origin);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Ошибка загрузки миксов');
    return res.json();
  },
  async getMix(id) {
    const res = await fetch(`/api/mixes/${id}`);
    if (!res.ok) throw new Error('Микс не найден');
    return res.json();
  },
  async getMixOfDay() {
    const res = await fetch('/api/mix-of-the-day');
    if (!res.ok) throw new Error('Нет микса дня');
    return res.json();
  },
  async getRandomMix() {
    const res = await fetch('/api/random-mix');
    if (!res.ok) throw new Error('Нет случайного микса');
    return res.json();
  },
  async postComment(mixId, text) {
    const res = await fetch(`/api/mixes/${mixId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Ошибка добавления комментария');
    return res.json();
  },
  async createOrder(payload) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Ошибка создания заказа');
    return res.json();
  },
  async getOrderStatus(id) {
    const res = await fetch(`/api/orders/${id}/status`);
    if (!res.ok) throw new Error('Ошибка статуса заказа');
    return res.json();
  },
  async adminLogin(login, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) throw new Error('Неверный логин или пароль');
    return res.json();
  },
  async adminGetOrders(token) {
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Ошибка загрузки заказов');
    return res.json();
  },
  async adminSetStatus(id, status, token) {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
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
    const res = await fetch(`/api/admin/orders/${id}/done`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Ошибка завершения заказа');
    return res.json();
  }
};

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
    updateOrderStatus(order.status);
  } catch (err) {
    alert(err.message || 'Ошибка создания заказа');
  }
}

function updateOrderStatus(status) {
  const section = $('orderStatusSection');
  const textEl = $('orderStatusText');
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
}

function startOrderPolling(id) {
  if (globalState.orderPollTimer) {
    clearInterval(globalState.orderPollTimer);
  }
  globalState.orderPollTimer = setInterval(async () => {
    try {
      const data = await api.getOrderStatus(id);
      updateOrderStatus(data.status);
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
  btnDone.textContent = 'Завершить';
  btnDone.addEventListener('click', async () => {
    try {
      await api.adminDone(o.id, globalState.adminToken);
      await refreshAdminOrders();
    } catch {
      alert('Ошибка завершения заказа');
    }
  });

  actions.appendChild(btnPreparing);
  actions.appendChild(btnHeating);
  actions.appendChild(btnDone);

  card.appendChild(header);
  card.appendChild(mixName);
  card.appendChild(time);
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

