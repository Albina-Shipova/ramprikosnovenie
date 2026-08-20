const SERVICES = [
  { name: 'Массаж спины+ШВЗ', category: 'massage', label: 'Классический массаж', price: 'от 1 000 ₽', duration: '40 мин' },
  { name: 'Массаж (90 мин)', category: 'massage', label: 'Классический массаж', price: 'от 2 500 ₽', duration: '1 ч 30 мин' },
  { name: 'Вакуумная терапия', category: 'massage', label: 'Классический массаж', price: '2 000 ₽', duration: '30 мин' },
  { name: 'Детский массаж', category: 'massage', label: 'Классический массаж', price: 'от 1 000 ₽', duration: '40 мин' },
  { name: 'Массаж (60 мин)', category: 'massage', label: 'Классический массаж', price: 'от 1 500 ₽', duration: '1 ч' },
  { name: 'Массаж тела 120 мин', category: 'massage', label: 'Классический массаж', price: '6 000 ₽', duration: '2 ч' },
  { name: 'Остеопрактика', category: 'massage', label: 'Классический массаж', price: '7 000 ₽', duration: '1 ч' },
  { name: 'Скульптурно-буккальный массаж', category: 'massage', label: 'Классический массаж', price: '3 000 ₽', duration: '1 ч' },
  { name: 'Путь воина (массаж лица + массаж стоп)', category: 'face', label: 'Массаж лица', price: 'от 2 900 ₽', duration: '1 ч 20 мин' },
  { name: 'Лифтинг-эффект (массаж лица фейспластичный)', category: 'face', label: 'Массаж лица', price: 'от 2 500 ₽', duration: '1 ч 30 мин' },
  { name: 'Преображение Венеры (массаж лица)', category: 'face', label: 'Массаж лица', price: 'от 4 000 ₽', duration: '1 ч 30 мин' },
  { name: 'Фреш Фейс (массаж лица с вакуумной баночкой)', category: 'face', label: 'Массаж лица', price: 'от 2 300 ₽', duration: '1 ч' },
  { name: 'FlaxSculpt (пептидное армирование)', category: 'cosmetology', label: 'Косметология', price: 'от 3 000 ₽', duration: '1 ч' },
  { name: 'Карбокситерапия', category: 'cosmetology', label: 'Косметология', price: '3 500 ₽', duration: '40 мин' },
  { name: 'Микронидлинг', category: 'cosmetology', label: 'Косметология', price: '4 500 ₽', duration: '40 мин' },
  { name: 'УЗ-чистка без ухода', category: 'cosmetology', label: 'Косметология', price: '2 700 ₽', duration: '30 мин' },
  { name: 'УЗ-чистка лица с уходом', category: 'cosmetology', label: 'Косметология', price: '3 300 ₽', duration: '1 ч' },
  { name: 'Гликолевый пилинг', category: 'peeling', label: 'Пилинг', price: '3 000 ₽', duration: '15 мин' },
  { name: 'Миндальный пилинг', category: 'peeling', label: 'Пилинг', price: '3 000 ₽', duration: '15 мин' },
  { name: 'Молочный пилинг', category: 'peeling', label: 'Пилинг', price: '3 000 ₽', duration: '30 мин' },
  { name: 'Пилинг для проблемной кожи (Израиль)', category: 'peeling', label: 'Пилинг', price: '3 500 ₽', duration: '35 мин' },
  { name: 'Пилинг с лифтинг-эффектом', category: 'peeling', label: 'Пилинг', price: '3 000 ₽', duration: '30 мин' },
  { name: 'Ревитализирующий пилинг без шелушения', category: 'peeling', label: 'Пилинг', price: '2 000 ₽', duration: '15 мин' },
  { name: 'Салициловый пилинг', category: 'peeling', label: 'Пилинг', price: '2 500 ₽', duration: '15 мин' },
  { name: 'Мультикислотный пилинг', category: 'peeling', label: 'Пилинг', price: '3 000 ₽', duration: '30 мин' },
  { name: 'Огненный массаж: 1+1 зона', category: 'spa', label: 'SPA', price: '5 000 ₽', duration: '40 мин' },
  { name: 'Огненный массаж: всё тело, голова и лицо', category: 'spa', label: 'SPA', price: '15 000 ₽', duration: '2 ч 30 мин' },
  { name: '«Тотальная перезагрузка»: массаж тела + лёгкий массаж лица', category: 'spa', label: 'SPA', price: '5 500 ₽', duration: '2 ч' },
  { name: 'Скульптор-SPA (авторский массаж лица)', category: 'spa', label: 'SPA', price: '6 000 ₽', duration: '1 ч 30 мин' },
  { name: 'SPA «Лёгкий силуэт»: лимфодренажный массаж + бандажное обёртывание', category: 'spa', label: 'SPA', price: '7 000 ₽', duration: '2 ч' },
  { name: 'SPA-лепка', category: 'spa', label: 'SPA', price: '7 000 ₽', duration: '2 ч' },
  { name: 'Q10 Rescue — уход для возрастной кожи', category: 'casmara', label: 'Уход Casmara', price: '8 000 ₽', duration: '1 ч' },
  { name: 'Антивозрастной уход против пигментации и тусклости', category: 'casmara', label: 'Уход Casmara', price: '12 000 ₽', duration: '1 ч' },
  { name: 'Очищающий уход «Чистый кислород»', category: 'casmara', label: 'Уход Casmara', price: '8 000 ₽', duration: '1 ч' },
  { name: 'Уход «Защита возраста»', category: 'casmara', label: 'Уход Casmara', price: '10 000 ₽', duration: '1 ч' },
  { name: 'Уход «Регенерин»', category: 'casmara', label: 'Уход Casmara', price: '8 000 ₽', duration: '1 ч' },
  { name: 'Уход «Сенсейшнс»: восстановление и сияние', category: 'casmara', label: 'Уход Casmara', price: '8 000 ₽', duration: '1 ч' }
];

const bookingUrl = 'https://dikidi.net/1188196';

function setupNavigation() {
  const page = document.body.dataset.page;
  const activeLink = document.querySelector(`[data-nav="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  };
  toggle.addEventListener('click', () => {
    const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(willOpen));
    nav.classList.toggle('open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
}

function setupReveals() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px' });
  items.forEach(item => {
    if (item.getBoundingClientRect().top < window.innerHeight * 1.05) {
      item.classList.add('visible');
    } else {
      observer.observe(item);
    }
  });

  // При быстрой прокрутке наблюдатель пропускает блоки, пролетевшие между кадрами:
  // добираем всё, что уже попало в экран или ушло выше него.
  let scheduled = false;
  const sweep = () => {
    scheduled = false;
    items.forEach(item => {
      if (item.classList.contains('visible')) return;
      if (item.getBoundingClientRect().top < window.innerHeight * 1.05) {
        item.classList.add('visible');
        observer.unobserve(item);
      }
    });
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sweep);
  }, { passive: true });
}

function setupServices() {
  const grid = document.querySelector('#service-grid');
  if (!grid) return;
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#service-empty');
  const search = document.querySelector('#service-search');
  const buttons = [...document.querySelectorAll('[data-service-filter]')];
  const requested = new URLSearchParams(location.search).get('category');
  let filter = buttons.some(button => button.dataset.serviceFilter === requested) ? requested : 'all';
  let query = '';

  const render = () => {
    const filtered = SERVICES.filter(service => {
      const matchesFilter = filter === 'all' || service.category === filter;
      const matchesQuery = service.name.toLocaleLowerCase('ru').includes(query);
      return matchesFilter && matchesQuery;
    });
    grid.innerHTML = filtered.map(service => `
      <article class="service-card reveal visible">
        <p class="service-card__label">${service.label}</p>
        <h3>${service.name}</h3>
        <div class="service-card__bottom">
          <div>
            <div class="service-card__price">${service.price}</div>
            <div class="service-card__duration">${service.duration}</div>
          </div>
          <a class="service-card__book" href="${bookingUrl}" target="_blank" rel="noopener" aria-label="Записаться на ${service.name}">↗</a>
        </div>
      </article>`).join('');
    count.textContent = `Показано ${filtered.length} ${serviceWord(filtered.length)}`;
    empty.hidden = filtered.length !== 0;
  };

  buttons.forEach(button => {
    button.classList.toggle('active', button.dataset.serviceFilter === filter);
    button.addEventListener('click', () => {
      filter = button.dataset.serviceFilter;
      buttons.forEach(item => item.classList.toggle('active', item === button));
      render();
    });
  });
  search.addEventListener('input', () => { query = search.value.trim().toLocaleLowerCase('ru'); render(); });
  render();
}

function serviceWord(number) {
  const lastTwo = number % 100;
  const last = number % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'услуг';
  if (last === 1) return 'услуга';
  if (last >= 2 && last <= 4) return 'услуги';
  return 'услуг';
}

function setupGallery() {
  const items = [...document.querySelectorAll('.gallery-item')];
  if (!items.length) return;
  const filters = [...document.querySelectorAll('[data-gallery-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.galleryFilter;
    filters.forEach(item => item.classList.toggle('active', item === button));
    items.forEach(item => item.classList.toggle('filtered-out', filter !== 'all' && item.dataset.galleryCategory !== filter));
  }));

  const lightbox = document.querySelector('.lightbox');
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('figcaption');
  const close = lightbox.querySelector('.lightbox-close');
  const previous = lightbox.querySelector('.lightbox-prev');
  const next = lightbox.querySelector('.lightbox-next');
  let current = 0;
  let previousFocus = null;

  const visibleItems = () => items.filter(item => !item.classList.contains('filtered-out'));
  const show = item => {
    image.src = item.dataset.lightbox;
    image.alt = item.querySelector('img').alt;
    caption.textContent = item.dataset.caption || '';
  };
  const open = item => {
    const visible = visibleItems();
    current = Math.max(0, visible.indexOf(item));
    previousFocus = document.activeElement;
    show(visible[current]);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    close.focus();
  };
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    image.src = '';
    document.body.style.overflow = '';
    if (previousFocus) previousFocus.focus();
  };
  const move = delta => {
    const visible = visibleItems();
    current = (current + delta + visible.length) % visible.length;
    show(visible[current]);
  };

  items.forEach(item => item.addEventListener('click', () => open(item)));
  close.addEventListener('click', closeLightbox);
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'Tab') {
      const controls = [close, previous, next];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); next.focus(); }
      if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); close.focus(); }
    }
  });
}

setupNavigation();
setupReveals();
setupServices();
setupGallery();
