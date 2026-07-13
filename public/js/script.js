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
  el.addEventListener('click', () => openGallery(el.dataset.model, 0));
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGallery(el.dataset.model, 0);
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

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  formMessage.textContent = '';
  formMessage.className = 'form-message';

  if (!name || !phone) {
    formMessage.textContent = 'Пожалуйста, укажите имя и телефон.';
    formMessage.classList.add('is-error');
    return;
  }

  const payload = {
    name,
    phone,
    project: document.getElementById('project').value,
    callTime: document.getElementById('callTime').value,
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
  } catch (err) {
    formMessage.textContent = err.message || 'Что-то пошло не так. Попробуйте ещё раз или позвоните нам.';
    formMessage.classList.add('is-error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Оставить заявку';
  }
});
