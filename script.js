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
    if (!track) return;

    // Некоторые карусели (например, мастера) листаются на любом экране,
    // а не только с планшета и ниже.
    const always = carousel.hasAttribute('data-carousel-always');

    const step = () => {
      const item = [...track.children].find(child => !child.classList.contains('filtered-out'));
      if (!item) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
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
        // В ленте наблюдатель не увидит карточки, уехавшие вбок, — показываем сразу.
        track.querySelectorAll('.reveal').forEach(item => item.classList.add('visible'));
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

setupNavigation();
setupReveals();
setupServices();
setupCarousels();
setupMasterCarouselHeight();
setupReviewPagers();
setupGallery();
