document.getElementById('year').textContent = new Date().getFullYear();

const GALLERIES = {
  '75': [
    { src: 'images/practik-75-exterior.png', caption: 'Внешний вид' },
    { src: 'images/practik-75-exterior2.png', caption: 'Внешний вид — вид с другого ракурса' },
    { src: 'images/practik-75-plan.png', caption: 'Планировка с мебелью и площадью каждой комнаты' },
    { src: 'images/c75_facade1.png', caption: 'Фасад в осях 1–4' },
    { src: 'images/c75_facade2.png', caption: 'Фасад в осях А–Д' },
    { src: 'images/c75_facade3.png', caption: 'Фасад в осях 4–1' },
    { src: 'images/c75_facade4.png', caption: 'Фасад в осях Д–А' },
    { src: 'images/c75_section1.png', caption: 'Разрез 1–1 — высоты от пола до потолка' },
    { src: 'images/c75_section2.png', caption: 'Разрез 2–2 — высоты от пола до потолка' },
  ],
  '90': [
    { src: 'images/practik-90-exterior.png', caption: 'Внешний вид' },
    { src: 'images/practik-90-exterior2.png', caption: 'Внешний вид — вид с другого ракурса' },
    { src: 'images/practik-90-plan.png', caption: 'Планировка с мебелью и площадью каждой комнаты' },
    { src: 'images/c90_facade1.png', caption: 'Фасад в осях 1–4' },
    { src: 'images/c90_facade2.png', caption: 'Фасад в осях А–Д' },
    { src: 'images/c90_facade3.png', caption: 'Фасад в осях 4–1' },
    { src: 'images/c90_facade4.png', caption: 'Фасад в осях Д–А' },
    { src: 'images/c90_section1.png', caption: 'Разрез 1–1 — высоты от пола до потолка' },
    { src: 'images/c90_section2.png', caption: 'Разрез 2–2 — высоты от пола до потолка' },
  ],
  '75m': [
    { src: 'images/practik-75-exterior.png', caption: 'Внешний вид' },
    { src: 'images/practik-75-exterior2.png', caption: 'Внешний вид — вид с другого ракурса' },
    { src: 'images/practik-75m-plan.png', caption: 'Планировка с мебелью и площадью каждой комнаты' },
    { src: 'images/c75_facade1.png', caption: 'Фасад в осях 1–4' },
    { src: 'images/c75_facade2.png', caption: 'Фасад в осях А–Д' },
    { src: 'images/c75_facade3.png', caption: 'Фасад в осях 4–1' },
    { src: 'images/c75_facade4.png', caption: 'Фасад в осях Д–А' },
    { src: 'images/c75_section1.png', caption: 'Разрез 1–1 — высоты от пола до потолка' },
    { src: 'images/c75_section2.png', caption: 'Разрез 2–2 — высоты от пола до потолка' },
  ],
  '90m': [
    { src: 'images/practik-90-exterior.png', caption: 'Внешний вид' },
    { src: 'images/practik-90-exterior2.png', caption: 'Внешний вид — вид с другого ракурса' },
    { src: 'images/practik-90m-plan.png', caption: 'Планировка с мебелью и площадью каждой комнаты' },
    { src: 'images/c90_facade1.png', caption: 'Фасад в осях 1–4' },
    { src: 'images/c90_facade2.png', caption: 'Фасад в осях А–Д' },
    { src: 'images/c90_facade3.png', caption: 'Фасад в осях 4–1' },
    { src: 'images/c90_facade4.png', caption: 'Фасад в осях Д–А' },
    { src: 'images/c90_section1.png', caption: 'Разрез 1–1 — высоты от пола до потолка' },
    { src: 'images/c90_section2.png', caption: 'Разрез 2–2 — высоты от пола до потолка' },
  ],
  real: [
    { src: 'images/gallery/real-01.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-02.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-03.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-04.jpg', caption: 'Готовый дом АПД Строй — терраса' },
    { src: 'images/gallery/real-05.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-06.jpg', caption: 'Готовый дом АПД Строй — интерьер' },
    { src: 'images/gallery/real-07.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-08.jpg', caption: 'Готовый дом АПД Строй — терраса' },
    { src: 'images/gallery/real-09.jpg', caption: 'Готовый дом АПД Строй — терраса' },
    { src: 'images/gallery/real-10.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-11.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-12.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-13.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-14.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-15.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-16.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-17.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-18.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-19.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-20.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-21.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-22.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-23.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-24.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-25.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-26.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-27.jpg', caption: 'Готовый дом АПД Строй — отделка' },
    { src: 'images/gallery/real-28.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-29.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-30.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-31.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-32.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-33.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-34.jpg', caption: 'Готовый дом АПД Строй' },
    { src: 'images/gallery/real-35.jpg', caption: 'Готовый дом АПД Строй' },
  ],
};

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxCounter = document.getElementById('lightboxCounter');

let currentGallery = [];
let currentIndex = 0;

function showSlide(index) {
  currentIndex = (index + currentGallery.length) % currentGallery.length;
  const slide = currentGallery[currentIndex];
  lightboxImg.src = slide.src;
  lightboxImg.alt = slide.caption;
  lightboxCaption.textContent = slide.caption;
  lightboxCounter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
}

function openGallery(model, startIndex) {
  currentGallery = GALLERIES[model];
  if (!currentGallery) return;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  showSlide(startIndex || 0);
}

function closeGallery() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('.js-open-gallery').forEach((el) => {
  const startIndex = Number(el.dataset.index) || 0;
  el.addEventListener('click', () => openGallery(el.dataset.model, startIndex));
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGallery(el.dataset.model, startIndex);
    }
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeGallery);
document.getElementById('lightboxPrev').addEventListener('click', () => showSlide(currentIndex - 1));
document.getElementById('lightboxNext').addEventListener('click', () => showSlide(currentIndex + 1));

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeGallery();
});

document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeGallery();
  if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
  if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
});

let touchStartX = null;
lightbox.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
});
lightbox.addEventListener('touchend', (event) => {
  if (touchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 40) {
    showSlide(deltaX > 0 ? currentIndex - 1 : currentIndex + 1);
  }
  touchStartX = null;
});

const projectSelect = document.getElementById('project');

/* Калькулятор "Подберите свой дом" */
(function () {
  const card = document.getElementById('calcCard');
  if (!card) return;

  const progressBar = document.getElementById('calcProgressBar');
  const steps = Array.from(card.querySelectorAll('.calc-step'));
  const resultStep = card.querySelector('.calc-result');
  const totalSteps = steps.length;

  const PROJECTS = {
    '75': { title: '«Практик 75»', img: 'images/practik-75-exterior.png', area: '75 м²', price: '3 340 000 ₽', formValue: 'Практик 75' },
    '75m': { title: '«Практик 75м»', img: 'images/practik-75m-plan.png', area: '75 м²', price: '3 340 000 ₽', formValue: 'Практик 75м' },
    '90': { title: '«Практик 90»', img: 'images/practik-90-exterior.png', area: '90 м²', price: '3 750 000 ₽', formValue: 'Практик 90' },
    '90m': { title: '«Практик 90м»', img: 'images/practik-90m-plan.png', area: '90 м²', price: '3 750 000 ₽', formValue: 'Практик 90м' },
  };

  let answers = {};

  function setProgress(stepIndex) {
    const pct = Math.round((stepIndex / (totalSteps + 1)) * 100);
    progressBar.style.width = Math.max(pct, 8) + '%';
  }

  function showStep(index) {
    steps.forEach((step, i) => { step.hidden = i !== index; });
    resultStep.hidden = true;
    setProgress(index);
  }

  function showResult() {
    const key = answers.size + (answers.terrace || '');
    const project = PROJECTS[key] || PROJECTS[answers.size];

    document.getElementById('calcResultImg').src = project.img;
    document.getElementById('calcResultImg').alt = project.title;
    document.getElementById('calcResultTitle').textContent = project.title;
    document.getElementById('calcResultArea').textContent = project.area;
    document.getElementById('calcResultPrice').textContent = project.price;

    const note = answers.mortgage === 'yes'
      ? 'Подходит под семейную ипотеку — поможем с расчётом и документами.'
      : 'Отличный выбор — рассчитаем удобный график оплаты.';
    document.getElementById('calcResultNote').textContent = note;

    const cta = document.getElementById('calcResultCta');
    cta.onclick = () => {
      projectSelect.value = project.formValue;
    };

    steps.forEach((step) => { step.hidden = true; });
    resultStep.hidden = false;
    progressBar.style.width = '100%';
  }

  card.addEventListener('click', (event) => {
    const option = event.target.closest('.calc-option');
    if (option) {
      const step = option.closest('.calc-step');
      const stepIndex = steps.indexOf(step);
      const question = option.dataset.question;
      const value = option.dataset.value;

      step.querySelectorAll('.calc-option').forEach((btn) => btn.classList.remove('is-selected'));
      option.classList.add('is-selected');
      answers[question] = value;

      window.setTimeout(() => {
        if (stepIndex + 1 < totalSteps) {
          showStep(stepIndex + 1);
        } else {
          showResult();
        }
      }, 220);
      return;
    }

    if (event.target.id === 'calcRestart') {
      answers = {};
      steps.forEach((step) => step.querySelectorAll('.calc-option').forEach((btn) => btn.classList.remove('is-selected')));
      showStep(0);
    }
  });

  showStep(0);
})();

document.querySelectorAll('.js-choose-project').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.house-card');
    const project = card.dataset.project;
    projectSelect.value = project;
    document.getElementById('lead-form').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('name').focus({ preventScroll: true });
  });
});

const leadForm = document.getElementById('leadForm');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('leadSubmitBtn');
const consentCheckbox = document.getElementById('consent');

consentCheckbox.addEventListener('change', () => {
  submitBtn.disabled = !consentCheckbox.checked;
});

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const consent = document.getElementById('consent').checked;

  formMessage.textContent = '';
  formMessage.className = 'form-message';

  if (!name || !phone) {
    formMessage.textContent = 'Пожалуйста, укажите имя и телефон.';
    formMessage.classList.add('is-error');
    return;
  }

  if (!consent) {
    formMessage.textContent = 'Нужно согласие на обработку персональных данных, чтобы отправить заявку.';
    formMessage.classList.add('is-error');
    return;
  }

  let yclid = null;
  try {
    const raw = localStorage.getItem('apd59-attribution');
    if (raw) {
      const attribution = JSON.parse(raw);
      if (attribution.ts && Date.now() - attribution.ts <= 21 * 86400 * 1000) {
        yclid = attribution.yclid || null;
      }
    }
  } catch (e) {}

  const payload = {
    name,
    phone,
    project: document.getElementById('project').value,
    callTime: document.getElementById('callTime').value,
    yclid,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправляем...';

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Не удалось отправить заявку.');
    }

    formMessage.textContent = 'Спасибо, менеджер свяжется в течение дня.';
    formMessage.classList.add('is-success');
    leadForm.reset();
    if (typeof ym === 'function') ym(111213103, 'reachGoal', 'lead_submit');
  } catch (err) {
    formMessage.textContent = err.message || 'Что-то пошло не так. Попробуйте ещё раз или позвоните нам.';
    formMessage.classList.add('is-error');
  } finally {
    submitBtn.disabled = !consentCheckbox.checked;
    submitBtn.textContent = 'Оставить заявку';
  }
});

document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (typeof ym === 'function') ym(111213103, 'reachGoal', 'phone_click');
  });
});

(function () {
  const projectSelect = document.getElementById('mcProject');
  const downInput = document.getElementById('mcDown');
  const yearsInput = document.getElementById('mcYears');
  const rateInput = document.getElementById('mcRate');
  const resultEl = document.getElementById('mcMonthly');
  if (!projectSelect || !downInput || !yearsInput || !rateInput || !resultEl) return;

  function calcMortgage() {
    const price = Number(projectSelect.value) || 0;
    const down = Number(downInput.value) || 0;
    const years = Number(yearsInput.value) || 0;
    const rate = Number(rateInput.value) || 0;

    const principal = Math.max(price - down, 0);
    const n = years * 12;
    const monthlyRate = rate / 100 / 12;

    if (n <= 0 || principal <= 0) {
      resultEl.textContent = '— ₽';
      return;
    }

    let payment;
    if (monthlyRate === 0) {
      payment = principal / n;
    } else {
      const factor = Math.pow(1 + monthlyRate, n);
      payment = (principal * monthlyRate * factor) / (factor - 1);
    }

    resultEl.textContent = Math.round(payment).toLocaleString('ru-RU') + ' ₽/мес';
  }

  [projectSelect, downInput, yearsInput, rateInput].forEach((el) => {
    el.addEventListener('input', calcMortgage);
    el.addEventListener('change', calcMortgage);
  });

  calcMortgage();
})();

(function () {
  const toggleBtn = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const badge = document.getElementById('chatUnreadBadge');
  if (!toggleBtn || !panel || !closeBtn || !messagesEl || !form || !input || !badge) return;

  const VISITOR_KEY = 'apd59-chat-visitor-id';
  const LAST_READ_KEY = 'apd59-chat-last-read-id';

  function readStorage(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  let visitorId = readStorage(VISITOR_KEY);
  if (!visitorId) {
    visitorId = window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    writeStorage(VISITOR_KEY, visitorId);
  }

  let lastId = 0;
  let lastReadId = Number(readStorage(LAST_READ_KEY)) || 0;
  let isOpen = false;
  let historyRendered = false;

  function renderMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg ' + (msg.direction === 'visitor' ? 'chat-msg-visitor' : 'chat-msg-manager');
    const p = document.createElement('p');
    p.textContent = msg.text;
    bubble.appendChild(p);
    messagesEl.appendChild(bubble);
  }

  function renderGreeting() {
    renderMessage({ direction: 'manager', text: 'Здравствуйте! Чем можем помочь? Задайте вопрос — ответим прямо здесь.' });
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateBadge() {
    const unread = Math.max(0, lastId - lastReadId);
    if (unread > 0 && !isOpen) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  async function fetchMessages(since) {
    const res = await fetch('/api/chat/messages?visitorId=' + encodeURIComponent(visitorId) + '&since=' + since);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'chat fetch failed');
    return json.messages;
  }

  async function poll() {
    try {
      const messages = await fetchMessages(lastId);
      if (!messages.length) return;
      messages.forEach((msg) => {
        lastId = Math.max(lastId, msg.id);
        if (isOpen && historyRendered) renderMessage(msg);
      });
      if (isOpen) {
        scrollToBottom();
        lastReadId = lastId;
        writeStorage(LAST_READ_KEY, String(lastReadId));
      }
      updateBadge();
    } catch (e) {
      // тихо игнорируем — следующий опрос попробует снова
    }
  }

  async function openPanel() {
    isOpen = true;
    panel.hidden = false;
    input.focus();

    if (!historyRendered) {
      historyRendered = true;
      try {
        const messages = await fetchMessages(0);
        if (messages.length) {
          messages.forEach((msg) => {
            renderMessage(msg);
            lastId = Math.max(lastId, msg.id);
          });
        } else {
          renderGreeting();
        }
      } catch (e) {
        renderGreeting();
      }
      scrollToBottom();
    }

    lastReadId = lastId;
    writeStorage(LAST_READ_KEY, String(lastReadId));
    updateBadge();
  }

  function closePanel() {
    isOpen = false;
    panel.hidden = true;
  }

  toggleBtn.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    historyRendered = true;
    renderMessage({ direction: 'visitor', text });
    scrollToBottom();

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, text }),
      });
      const json = await res.json();
      if (json.ok) {
        lastId = Math.max(lastId, json.id);
        lastReadId = lastId;
        writeStorage(LAST_READ_KEY, String(lastReadId));
      }
    } catch (e) {
      // сообщение уже показано локально — подтянется на следующем poll, если что-то пошло не так
    }
  });

  poll();
  setInterval(poll, 5000);
})();
