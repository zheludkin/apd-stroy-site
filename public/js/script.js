document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('.house-card').forEach((card) => {
  const checkbox = card.querySelector('.terrace-checkbox');
  const badge = card.querySelector('.terrace-badge');

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      badge.textContent = 'с террасой';
      badge.classList.add('is-active');
    } else {
      badge.textContent = 'без террасы';
      badge.classList.remove('is-active');
    }
  });
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
