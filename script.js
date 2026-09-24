function setupNavigation() {
  const page = document.body.dataset.page;
  const activeLink = document.querySelector(`[data-nav="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const header = document.querySelector('.site-header');
  if (!toggle || !nav) return;
  const syncHeaderHeight = () => {
    if (header) document.documentElement.style.setProperty('--header-h', `${header.getBoundingClientRect().height}px`);
  };
  let lockedScrollY = 0;
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  };
  toggle.addEventListener('click', () => {
    const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
    if (willOpen) {
      syncHeaderHeight();
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;
    }
    toggle.setAttribute('aria-expanded', String(willOpen));
    nav.classList.toggle('open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
    if (!willOpen) {
      document.body.style.top = '';
      window.scrollTo(0, lockedScrollY);
    }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canObserve = 'IntersectionObserver' in window;
// Два кадра, чтобы браузер нарисовал исходное состояние. В фоновой вкладке кадров нет —
// страхуемся таймером, иначе первый экран остался бы скрытым (и для поисковых роботов тоже).
const nextFrames = callback => {
  let done = false;
  const run = () => { if (!done) { done = true; callback(); } };
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 300);
};

// Всё, что попало в экран за один кадр, появляется лесенкой: сверху вниз, слева направо.
// Задержку снимаем после показа, иначе она тормозила бы и hover-переходы карточки.
function showStaggered(items) {
  items
    .map(item => ({ item, box: item.getBoundingClientRect() }))
    .sort((a, b) => (a.box.top - b.box.top) || (a.box.left - b.box.left))
    .forEach(({ item }, index) => {
      item.style.setProperty('--i', Math.min(index, 6));
      item.classList.add('visible');
      setTimeout(() => item.style.removeProperty('--i'), 1600);
    });
}

function setupReveals() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!items.length) return;
  if (reduceMotion.matches || !canObserve) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    const shown = entries.filter(entry => entry.isIntersecting).map(entry => entry.target);
    shown.forEach(item => observer.unobserve(item));
    const fresh = shown.filter(item => !item.classList.contains('visible'));
    if (fresh.length) showStaggered(fresh);
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

  // Первый экран тоже появляется с анимацией.
  const inView = item => item.getBoundingClientRect().top < window.innerHeight * 1.02;
  const initial = items.filter(inView);
  items.filter(item => !initial.includes(item)).forEach(item => observer.observe(item));
  nextFrames(() => showStaggered(initial));

  // При быстрой прокрутке наблюдатель пропускает блоки, пролетевшие между кадрами:
  // добираем всё, что уже попало в экран или ушло выше него.
  let scheduled = false;
  const sweep = () => {
    scheduled = false;
    const missed = items.filter(item => !item.classList.contains('visible') && inView(item));
    missed.forEach(item => observer.unobserve(item));
    if (missed.length) showStaggered(missed);
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sweep);
  }, { passive: true });
}

// Лента карусели появляется целиком, когда доезжает до экрана: наблюдатель
// не видит карточки, уехавшие вбок за край ленты.
function revealWhenSeen(container) {
  const items = [...container.querySelectorAll('.reveal:not(.visible)')];
  if (!items.length) return;
  if (reduceMotion.matches || !canObserve) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    showStaggered(items.filter(item => !item.classList.contains('visible')));
  }, { threshold: 0.12 });
  observer.observe(container);
}

// Карточки услуг лежат в HTML (нужно поиску), скрипт только фильтрует их.
function setupServices() {
  const grid = document.querySelector('#service-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.service-card')];
  const empty = document.querySelector('#service-empty');
  const search = document.querySelector('#service-search');
  const buttons = [...document.querySelectorAll('[data-service-filter]')];
  const requested = new URLSearchParams(location.search).get('category');
  let filter = buttons.some(button => button.dataset.serviceFilter === requested) ? requested : 'all';
  let query = '';

  const render = () => {
    let shown = 0;
    cards.forEach(card => {
      const match = (filter === 'all' || card.dataset.category === filter)
        && card.dataset.name.includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });
    empty.hidden = shown !== 0;
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

function setupProcedureMenu() {
  const menu = document.querySelector('.procedure-menu');
  if (!menu) return;
  const search = menu.querySelector('[data-menu-search]');
  const rowsHost = menu.querySelector('.procedure-menu__rows');
  const count = menu.querySelector('.procedure-menu__count');
  const title = menu.querySelector('.procedure-menu__visual h3');
  const visualImage = menu.querySelector('.procedure-menu__visual > img');
  const visualIntro = menu.querySelector('.procedure-menu__visual-copy > p:last-child');
  const visualNumber = menu.querySelector('.procedure-menu__number');
  const tabs = [...menu.querySelectorAll('[data-menu-filter]')];
  const cards = [...document.querySelectorAll('#service-grid .service-card')];
  const catalogData = {
    face: [['Путь воина (массаж лица + массаж стоп)', '1 ч 20 мин', 'от 2 900 ₽'], ['Лифтинг-эффект', '1 ч 30 мин', 'от 2 500 ₽'], ['Преображение Венеры', '1 ч 30 мин', 'от 4 000 ₽']],
    cosmetology: [['FlaxSculpt (пептидное армирование)', '1 ч', 'от 3 000 ₽'], ['Карбокситерапия', '40 мин', '3 500 ₽'], ['Микронидлинг', '40 мин', '4 500 ₽'], ['УЗ-чистка лица с уходом', '1 ч', '3 300 ₽']],
    peeling: [['Гликолевый пилинг', '15 мин', '3 000 ₽'], ['Миндальный пилинг', '15 мин', '3 000 ₽'], ['Молочный пилинг', '30 мин', '3 000 ₽'], ['Мультикислотный пилинг', '30 мин', '3 000 ₽']],
    spa: [['Огненный массаж: 1+1 зона', '40 мин', '5 000 ₽'], ['Огненный массаж: всё тело, голова и лицо', '2 ч 30 мин', '15 000 ₽'], ['«Тотальная перезагрузка»', '2 ч', '5 500 ₽'], ['Скульптор-SPA', '1 ч 30 мин', '6 000 ₽']],
    casmara: [['Q10 Rescue — уход для возрастной кожи', '1 ч', '8 000 ₽'], ['Антивозрастной уход против пигментации', '1 ч', '12 000 ₽'], ['Очищающий уход «Чистый кислород»', '1 ч', '8 000 ₽']]
  };
  const massageMarkup = rowsHost.innerHTML;
  const labels = {
    all: 'Все услуги', massage: 'Массаж тела', face: 'Массаж лица',
    cosmetology: 'Косметология', peeling: 'Пилинги', spa: 'SPA-программы', casmara: 'Уходы Casmara'
  };
  const categoryVisuals = {
    all: {
      image: 'assets/images/process-body-care.webp', alt: 'Уходовая процедура для тела', number: '01',
      intro: 'Выберите направление и найдите процедуру, которая подходит вашему запросу.'
    },
    massage: {
      image: 'assets/images/process-back-massage.webp', alt: 'Массаж спины в студии «Прикосновение»', number: '01',
      intro: 'Восстановление, лёгкость и внутренняя энергия. Подберём технику массажа под ваши цели и состояние.'
    },
    face: {
      image: 'assets/images/process-face-care.webp', alt: 'Массаж и уход за лицом', number: '02',
      intro: 'Деликатные техники для расслабления, свежего вида и комплексного ухода за лицом.'
    },
    cosmetology: {
      image: 'assets/images/process-cosmetology.webp', alt: 'Косметологическая процедура в студии', number: '03',
      intro: 'Современные процедуры с индивидуальным подбором средств и параметров воздействия.'
    },
    peeling: {
      image: 'assets/images/process-face-glass.webp', alt: 'Профессиональный уход за кожей лица', number: '04',
      intro: 'Мягкое обновление кожи, работа с текстурой и тоном под контролем специалиста.'
    },
    spa: {
      image: 'assets/images/fire-massage.webp', alt: 'Авторская SPA-процедура в студии', number: '05',
      intro: 'Продуманные программы для глубокого отдыха, ухода за телом и ощущения лёгкости.'
    },
    casmara: {
      image: 'assets/images/ksanti-oils.webp', alt: 'Профессиональные средства для ухода за кожей', number: '06',
      intro: 'Профессиональные программы Casmara для питания, восстановления и сияния кожи.'
    }
  };

  const bindRows = () => {
    [...rowsHost.querySelectorAll('details')].forEach(row => row.addEventListener('toggle', () => {
      if (!row.open) return;
      rowsHost.querySelectorAll('details').forEach(other => { if (other !== row) other.open = false; });
    }));
  };

  const render = filter => {
    if (filter === 'massage') {
      rowsHost.innerHTML = massageMarkup;
    } else {
      const visible = filter === 'all' ? cards : cards.filter(card => card.dataset.category === filter);
      const items = visible.length ? visible.map(card => [card.querySelector('h3').textContent, card.querySelector('.service-card__duration').textContent, card.querySelector('.service-card__price').textContent]) : (catalogData[filter] || Object.values(catalogData).flat());
      rowsHost.replaceChildren(...items.map(item => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const name = document.createElement('span');
        const duration = document.createElement('small');
        const price = document.createElement('strong');
        const plus = document.createElement('i');
        name.textContent = item[0];
        duration.textContent = item[1];
        price.textContent = item[2];
        summary.append(name, duration, price, plus);
        const body = document.createElement('div');
        const description = document.createElement('p');
        description.textContent = 'Подробности процедуры и индивидуальные рекомендации специалист уточнит перед записью.';
        const book = document.createElement('a');
        book.href = 'https://dikidi.net/1188196';
        book.target = '_blank'; book.rel = 'noopener'; book.textContent = 'Записаться →';
        body.append(description, book);
        details.append(summary, body);
        return details;
      }));
    }
    const total = rowsHost.querySelectorAll('details').length;
    count.firstChild.textContent = `${total} ${total === 1 ? 'процедура' : total < 5 ? 'процедуры' : 'процедур'} `;
    title.textContent = labels[filter];
    const visual = categoryVisuals[filter];
    visualImage.src = visual.image;
    visualImage.alt = visual.alt;
    visualNumber.firstChild.textContent = `${visual.number} `;
    visualIntro.textContent = visual.intro;
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.menuFilter === filter));
    bindRows();
    if (search) search.dispatchEvent(new Event('input'));
  };

  tabs.forEach(tab => tab.addEventListener('click', event => {
    event.preventDefault();
    render(tab.dataset.menuFilter);
  }));

  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('ru');
      rowsHost.querySelectorAll('details').forEach(row => {
        row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase('ru').includes(query);
      });
    });
  }
  bindRows();
}

// Дорожка мастеров держит высоту открытой карточки, а не самой длинной из всех.
function setupMasterCarouselHeight() {
  const track = document.querySelector('.master-carousel__track');
  if (!track) return;
  const slides = [...track.children];
  if (!slides.length) return;

  const apply = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = slides[0].getBoundingClientRect().width + gap;
    const index = step ? Math.round(track.scrollLeft / step) : 0;
    const slide = slides[Math.min(Math.max(index, 0), slides.length - 1)];
    track.style.height = `${slide.offsetHeight}px`;
  };

  let frame = null;
  let timer = null;
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(apply);
    // Страховка: если кадры не приходят (свёрнутая вкладка, программная прокрутка),
    // высота всё равно обновится — иначе высокие карточки (с видео) обрезаются.
    clearTimeout(timer);
    timer = setTimeout(apply, 140);
  };

  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    slides.forEach(slide => observer.observe(slide));
  }
  track.querySelectorAll('img').forEach(image => image.addEventListener('load', schedule));
  apply();
}

// Карусель: с планшета и ниже дорожка становится горизонтальной лентой.
// Прокрутка — родная (палец, трекпад, колесо), плюс стрелки и перетаскивание мышью.
function setupCarousels() {
  const carousels = [...document.querySelectorAll('[data-carousel]')];
  if (!carousels.length) return;

  const query = window.matchMedia('(max-width: 1024px)');

  carousels.forEach(carousel => {
    const track = carousel.querySelector('.carousel__track');
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const progress = carousel.querySelector('.carousel__progress span');
    const nameRail = carousel.querySelector('.master-carousel__names');
    const masterCounter = carousel.querySelector('.master-carousel__counter');
    if (!track) return;

    const items = [...track.children].filter(child => !child.classList.contains('filtered-out'));
    let nameButtons = [];
    if (nameRail) {
      nameButtons = items.map((item, index) => {
        const nameItem = document.createElement('span');
        nameItem.className = 'master-carousel__name-item';
        const button = document.createElement('button');
        button.className = 'master-carousel__name';
        button.type = 'button';
        const fullName = item.querySelector('h3')?.textContent?.trim() || `${index + 1}`;
        button.textContent = fullName.split(/\s+/)[0];
        button.setAttribute('aria-label', `Показать: ${button.textContent}`);
        nameItem.append(button);
        if (item.querySelector('[data-master-video]')) {
          const videoMark = document.createElement('span');
          videoMark.className = 'master-carousel__video-mark';
          videoMark.setAttribute('aria-hidden', 'true');
          videoMark.textContent = '▶';
          nameItem.append(videoMark);
        }
        nameRail.append(nameItem);
        return button;
      });
    }

    if (nameRail) {
      const bookingSource = document.querySelector('.header-cta');
      items.forEach(item => {
        const photo = item.querySelector('.master-slide__photo');
        const video = item.querySelector('.master-videos');
        if (photo && !photo.parentElement.classList.contains('master-slide__visual')) {
          const visual = document.createElement('div');
          visual.className = 'master-slide__visual';
          photo.before(visual);
          visual.append(photo);
          if (video) visual.append(video);
        }

        const body = item.querySelector('.master-slide__body');
        const profile = item.querySelector('.team__link');
        if (body && profile && !profile.parentElement.classList.contains('master-slide__actions')) {
          const actions = document.createElement('div');
          actions.className = 'master-slide__actions';
          profile.before(actions);
          actions.append(profile);
          if (bookingSource) {
            const booking = bookingSource.cloneNode(true);
            booking.className = 'button master-slide__booking';
            actions.append(booking);
          }
        }
      });
    }

    // Некоторые карусели (например, мастера) листаются на любом экране,
    // а не только с планшета и ниже.
    const always = carousel.hasAttribute('data-carousel-always');

    const step = () => {
      const item = [...track.children].find(child => !child.classList.contains('filtered-out'));
      if (!item) return track.clientWidth || 1;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap || 1;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = max > 1 ? track.scrollLeft / max : 0;
      if (progress) {
        // Ползунок шириной с видимую долю ленты, едет по остатку дорожки.
        const share = Math.max(.12, Math.min(1, track.clientWidth / track.scrollWidth));
        progress.style.width = `${share * 100}%`;
        progress.style.transform = `translateX(${ratio * (100 / share - 100)}%)`;
      }
      if (previous) previous.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (nameButtons.length) {
        const raw = Math.round(track.scrollLeft / step());
        const current = Math.max(0, Math.min(nameButtons.length - 1, Number.isFinite(raw) ? raw : 0));
        if (masterCounter) {
          masterCounter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(nameButtons.length).padStart(2, '0')}`;
        }
        nameButtons.forEach((button, index) => {
          const active = index === current;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-current', active ? 'true' : 'false');
        });
        const activeName = nameButtons[current].parentElement;
        const left = activeName.offsetLeft - (nameRail.clientWidth - activeName.offsetWidth) / 2;
        nameRail.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };

    let scheduled = false;
    track.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; update(); });
    }, { passive: true });

    // Своя анимация вместо scroll-behavior: браузер отменяет плавную прокрутку
    // контейнера со scroll-snap, и лента остаётся на месте.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;

    let guard = null;

    const finish = to => {
      if (animation) cancelAnimationFrame(animation);
      if (guard) clearTimeout(guard);
      animation = null;
      guard = null;
      track.scrollLeft = to;
      track.style.scrollSnapType = '';
      update();
      // явно уведомляем слушателей прокрутки (высота карусели мастеров) —
      // при программной доводке нативный scroll может не прийти
      track.dispatchEvent(new Event('scroll'));
    };

    const animateTo = target => {
      const max = track.scrollWidth - track.clientWidth;
      const to = Math.max(0, Math.min(max, target));
      const from = track.scrollLeft;
      const distance = to - from;
      if (Math.abs(distance) < 1) return;
      if (calm.matches) { finish(to); return; }

      if (animation) cancelAnimationFrame(animation);
      if (guard) clearTimeout(guard);
      const duration = Math.min(600, 280 + Math.abs(distance) * 0.35);
      const started = performance.now();
      track.style.scrollSnapType = 'none';

      const tick = now => {
        const part = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - part, 3);
        track.scrollLeft = from + distance * eased;
        if (part < 1) animation = requestAnimationFrame(tick);
        else finish(to);
      };
      animation = requestAnimationFrame(tick);
      // Во вкладке без отрисовки кадры не приходят — дожимаем прокрутку и
      // возвращаем снап, иначе лента застрянет на месте.
      guard = setTimeout(() => finish(to), duration + 220);
    };

    const scrollBy = delta => animateTo(track.scrollLeft + delta * step());
    if (previous) previous.addEventListener('click', () => scrollBy(-1));
    if (next) next.addEventListener('click', () => scrollBy(1));
    nameButtons.forEach((button, index) => button.addEventListener('click', () => animateTo(index * step())));
    const openMasterVideo = videoData => {
      document.dispatchEvent(new CustomEvent('master-video:open', {
        detail: {
          src: videoData.dataset.masterVideo,
          poster: videoData.dataset.masterVideoPoster || ''
        }
      }));
    };
    items.forEach(item => {
      const videoData = item.querySelector('[data-master-video]');
      videoData?.querySelector('.master-video-trigger')?.addEventListener('click', () => openMasterVideo(videoData));
    });

    // Перетаскивание мышью. Палец обрабатывает сам браузер — так плавнее.
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !(always || query.matches)) return;
      // Кнопки внутри карточки (например, пролистывание отзывов) не должны запускать драг —
      // иначе setPointerCapture перехватывает их клик.
      if (event.target.closest('button, a')) return;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      lastX = event.clientX;
      lastT = performance.now();
      velocity = 0;
      startScroll = track.scrollLeft;
      carousel.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (!dragging) return;
      const shift = event.clientX - startX;
      moved = Math.max(moved, Math.abs(shift));
      track.scrollLeft = startScroll - shift;
      const now = performance.now();
      if (now > lastT) velocity = (event.clientX - lastX) / (now - lastT); // px/мс
      lastX = event.clientX;
      lastT = now;
    });
    const endDrag = event => {
      if (!dragging) return;
      dragging = false;
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);

      // Куда доводить: небольшого сдвига или быстрого флика достаточно, чтобы перелистнуть.
      const span = step();
      const dragged = track.scrollLeft - startScroll;        // > 0 — тянули к следующей карточке
      const dir = dragged !== 0 ? Math.sign(dragged) : (velocity !== 0 ? -Math.sign(velocity) : 0);
      const flick = Math.abs(velocity) > 0.35 && moved > 12; // быстрый рывок, ~350 px/с
      const threshold = Math.max(28, Math.min(70, span * 0.1));

      let target = startScroll;
      if (dir !== 0 && (Math.abs(dragged) > threshold || flick)) {
        target = startScroll + dir * span;
      }

      carousel.classList.remove('is-dragging');
      animateTo(target);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    // После перетаскивания не открывать лайтбокс и не уходить по ссылке.
    track.addEventListener('click', event => {
      if (moved > 6) { event.preventDefault(); event.stopPropagation(); }
      moved = 0;
    }, true);

    const apply = () => {
      const active = always || query.matches;
      carousel.classList.toggle('is-active', active);
      if (active) {
        revealWhenSeen(track);
      } else {
        track.scrollLeft = 0;
      }
      update();
    };

    query.addEventListener('change', apply);
    window.addEventListener('resize', update, { passive: true });
    document.addEventListener('carousel:refresh', () => {
      track.scrollLeft = 0;
      update();
    });
    apply();
  });
}

// Отзывы мастера внутри карточки: если их несколько — листаются по одному.
function setupReviewPagers() {
  document.querySelectorAll('[data-review-pager]').forEach(pager => {
    const items = [...pager.querySelectorAll('.master-review')];
    const previous = pager.querySelector('[data-review-prev]');
    const next = pager.querySelector('[data-review-next]');
    const counter = pager.querySelector('[data-review-counter]');
    if (items.length <= 1) return;

    let index = 0;
    const show = target => {
      index = (target + items.length) % items.length;
      items.forEach((item, i) => { item.hidden = i !== index; });
      if (counter) counter.textContent = `${index + 1} / ${items.length}`;
    };
    if (previous) previous.addEventListener('click', () => show(index - 1));
    if (next) next.addEventListener('click', () => show(index + 1));
  });
}

function setupGallery() {
  const items = [...document.querySelectorAll('.gallery-item')];
  if (!items.length) return;

  // Кладка «пирамидкой»: на десктопе .gallery-grid — это CSS grid с grid-auto-rows: 1px,
  // каждой плитке проставляем grid-row-end по её высоте. Так колонки всегда ровные,
  // без капризов балансировки multicol.
  const grid = document.querySelector('.gallery-grid');
  const relayout = () => {
    if (!grid) return;
    const cs = getComputedStyle(grid);
    if (cs.display !== 'grid') { items.forEach(i => i.style.removeProperty('grid-row-end')); return; }
    const gap = parseFloat(cs.columnGap) || 0;
    items.forEach(item => {
      if (item.classList.contains('filtered-out')) { item.style.removeProperty('grid-row-end'); return; }
      const h = item.getBoundingClientRect().height;
      item.style.gridRowEnd = `span ${Math.max(1, Math.ceil(h + gap))}`;
    });
  };
  let relayoutQueued = false;
  const scheduleRelayout = () => {
    if (relayoutQueued) return;
    relayoutQueued = true;
    requestAnimationFrame(() => { relayoutQueued = false; relayout(); });
  };
  window.addEventListener('resize', scheduleRelayout, { passive: true });
  document.addEventListener('carousel:refresh', scheduleRelayout);
  if (grid) grid.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', scheduleRelayout, { once: true });
  });
  relayout();

  const filters = [...document.querySelectorAll('[data-gallery-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.galleryFilter;
    filters.forEach(item => item.classList.toggle('active', item === button));
    items.forEach(item => item.classList.toggle('filtered-out', filter !== 'all' && item.dataset.galleryCategory !== filter));
    document.dispatchEvent(new CustomEvent('carousel:refresh'));
    scheduleRelayout();
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

function setupMasterVideoModal() {
  const modal = document.querySelector('.video-modal');
  if (!modal) return;
  const video = modal.querySelector('video');
  const close = modal.querySelector('.video-modal__close');
  let previousFocus = null;

  const closeModal = () => {
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    previousFocus?.focus();
  };

  document.addEventListener('master-video:open', event => {
    if (!event.detail?.src) return;
    previousFocus = document.activeElement;
    video.src = event.detail.src;
    if (event.detail.poster) video.poster = event.detail.poster;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    close.focus();
  });

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const controls = [close, video];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); video.focus(); }
      if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); close.focus(); }
    }
  });
}

function setupScrollProgress() {
  const bar = document.querySelector('.scroll-progress span');
  if (!bar) return;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    bar.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

function setupTopControls() {
  const totop = document.querySelector('.totop');
  const fab = document.querySelector('.contact-fab');
  if (!totop && !fab) return;

  let scheduled = false;
  const update = () => {
    scheduled = false;
    const visible = window.scrollY > 480;
    if (totop) totop.classList.toggle('is-visible', visible);
    if (fab) fab.classList.toggle('is-visible', visible);
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();

  if (totop) totop.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (fab) {
    const btn = fab.querySelector('.contact-fab__toggle');
    const setOpen = open => {
      fab.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => setOpen(!fab.classList.contains('is-open')));
    document.addEventListener('click', event => { if (!fab.contains(event.target)) setOpen(false); });
    fab.querySelectorAll('.contact-fab__item').forEach(item => item.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  }
}

// Заголовки поднимаются по словам из-под невидимой линии.
// Делим только пробелами: неразрывные пробелы остаются внутри слова.
function splitWords(heading) {
  let count = 0;
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName !== 'BR') walk(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
      const fragment = document.createDocumentFragment();
      child.textContent.split(/([ \t\r\n]+)/).forEach(part => {
        if (!part) return;
        if (!part.trim()) { fragment.append(part); return; }
        const word = document.createElement('span');
        const inner = document.createElement('span');
        word.className = 'word';
        inner.className = 'word__in';
        inner.style.setProperty('--w', Math.min(count++, 9));
        inner.textContent = part;
        word.append(inner);
        fragment.append(word);
      });
      child.replaceWith(fragment);
    });
  };
  walk(heading);
  heading.classList.add('split');
}

function setupHeadings() {
  if (reduceMotion.matches || !canObserve) return;
  const headings = [...document.querySelectorAll('main h1, main h2:not(.trust-title)')];
  headings.forEach(splitWords);
  const show = heading => {
    heading.classList.add('split-in');
    // После подъёма снимаем обрезку слов, чтобы не держать лишние слои.
    setTimeout(() => heading.classList.add('split-done'), 1500);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      show(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px' });
  nextFrames(() => headings.forEach(heading => {
    if (heading.getBoundingClientRect().top < window.innerHeight) show(heading);
    else observer.observe(heading);
  }));
}

// Рейтинг: звёзды зажигаются по очереди, оценка набирается от нуля.
function setupRating() {
  const panel = document.querySelector('.rating-panel');
  if (!panel || reduceMotion.matches || !canObserve) return;
  const stars = panel.querySelector('.stars');
  const score = panel.querySelector('strong');
  if (stars) {
    stars.innerHTML = [...stars.textContent.trim()]
      .map((star, index) => `<span style="--s:${index}">${star}</span>`).join('');
  }
  const target = score ? parseFloat(score.textContent.replace(',', '.')) : NaN;
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    panel.classList.add('is-lit');
    if (Number.isNaN(target)) return;
    const start = performance.now();
    const tick = now => {
      const part = Math.min(1, (now - start) / 1100);
      const eased = 1 - Math.pow(1 - part, 3);
      score.textContent = (target * eased).toFixed(1).replace('.', ',');
      if (part < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.5 });
  observer.observe(panel);
}

// Мотив «прикосновения»: тёплый свет идёт за курсором по фото-карточкам,
// а по кнопке от точки нажатия расходится мягкий круг.
function setupTouch() {
  if (reduceMotion.matches) return;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.direction, .gallery-item').forEach(card => {
      let frame = 0;
      let x = 0;
      let y = 0;
      card.classList.add('touch-glow');
      card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        x = event.clientX - box.left;
        y = event.clientY - box.top;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          card.style.setProperty('--mx', `${x}px`);
          card.style.setProperty('--my', `${y}px`);
        });
      }, { passive: true });
    });
  }
  document.addEventListener('pointerdown', event => {
    const button = event.target.closest('.button, .edu-button');
    if (!button || !button.animate) return;
    const box = button.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2.4;
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - box.left - size / 2}px;top:${event.clientY - box.top - size / 2}px`;
    button.append(ripple);
    ripple.animate(
      [{ transform: 'scale(0)', opacity: .38 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 650, easing: 'cubic-bezier(.16, 1, .3, 1)' }
    ).onfinish = () => ripple.remove();
  }, { passive: true });
}

setupNavigation();
setupReveals();
setupHeadings();
setupRating();
setupTouch();
setupServices();
setupProcedureMenu();
setupCarousels();
setupMasterCarouselHeight();
setupReviewPagers();
setupGallery();
setupMasterVideoModal();
setupScrollProgress();
setupTopControls();
