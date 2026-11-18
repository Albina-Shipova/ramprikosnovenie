(() => {
  const key = 'site-analytics-consent-v2';
  const counter = 113366309;
  const version = '2026-11-18-v2';
  const endpoint = 'https://asama79164.tw1.ru/api/site-consent/';
  const year = 365 * 24 * 60 * 60 * 1000;
  const settings = document.querySelector('#analytics-controls');

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  }

  function readChoice() {
    const state = readState();
    if (Date.now() - state.at < year) return state.value;
  }

  async function send(event) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(7000),
      body: JSON.stringify(event)
    });
    if (!response.ok || !(await response.json()).saved) {
      throw new Error('Не удалось записать выбор');
    }
  }

  function startAnalytics() {
    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();
    window.ym(counter, 'init', {
      ssr: true, webvisor: true, clickmap: true, trackLinks: true,
      accurateTrackBounce: true, ecommerce: 'dataLayer',
      referrer: document.referrer, url: location.href
    });
    const script = document.createElement('script');
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counter;
    script.async = true;
    document.head.append(script);

    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.dataset.metrikaGoal) {
        window.ym(counter, 'reachGoal', link.dataset.metrikaGoal);
      } else if (link.origin === 'https://dikidi.net' && /^\/1188196\/?$/.test(link.pathname)) {
        window.ym(counter, 'reachGoal', 'booking_click');
      }
    });
  }

  const initialChoice = readChoice();
  let currentChoice = initialChoice;
  let analyticsStarted = false;

  function applyChoice() {
    if (!settings && currentChoice === 'accepted' && !analyticsStarted) {
      analyticsStarted = true;
      startAnalytics();
    }
  }

  function saveState(state) {
    localStorage.setItem(key, JSON.stringify(state));
  }

  async function completeRevoke(state) {
    await send(state.pending);
    if (readState().pending?.event_id === state.pending.event_id) {
      saveState({ ...state, pending: null });
    }
  }

  function makeEvent(action, browserId) {
    return { action, browser_id: browserId, event_id: crypto.randomUUID(), version };
  }

  async function choose(value) {
    let state = readState();
    if (value === 'declined') {
      const needsRevoke = state.value === 'accepted' || state.pending?.action === 'grant';
      const pending = needsRevoke ? makeEvent('revoke', state.browserId) : state.pending;
      state = { value, at: Date.now(), browserId: state.browserId, pending };
      saveState(state);
      currentChoice = value;
      if (analyticsStarted) location.reload();
      if (pending) await completeRevoke(state);
      return;
    }

    if (state.pending?.action === 'revoke') await completeRevoke(state);
    if (readChoice() === 'accepted') return;
    state = readState();
    const browserId = state.browserId || crypto.randomUUID();
    const event = state.pending?.action === 'grant' ? state.pending : makeEvent('grant', browserId);
    saveState({ ...state, browserId, pending: event });
    await send(event);
    if (readState().pending?.event_id !== event.event_id) return;
    saveState({ value, at: Date.now(), browserId });
    currentChoice = value;
    applyChoice();
  }

  let updating = false;
  async function updateChoice(value, status, onSuccess) {
    if (updating) return;
    updating = true;
    status.textContent = 'Сохраняем выбор…';
    try {
      await choose(value);
      onSuccess();
    } catch {
      status.textContent = value === 'declined' && currentChoice === 'declined'
        ? 'Аналитика отключена. Отзыв будет отправлен при следующем открытии сайта.'
        : 'Не удалось сохранить выбор. Повторите попытку.';
    } finally {
      updating = false;
    }
  }

  const savedState = readState();
  if (savedState.pending?.action === 'revoke') {
    completeRevoke(savedState).catch(() => {});
  }

  if (settings) {
    const status = settings.querySelector('[role="status"]');
    function showStatus() {
      status.textContent = {
        accepted: 'Аналитика разрешена.',
        declined: 'Аналитика отключена.'
      }[currentChoice] || 'Вы ещё не выбрали настройки.';
    }
    showStatus();
    settings.addEventListener('click', event => {
      const button = event.target.closest('[data-consent]');
      if (!button) return;
      updateChoice(button.dataset.consent, status, showStatus);
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      currentChoice = readChoice();
      showStatus();
    });
  } else {
    applyChoice();
    const refreshIfChanged = () => {
      if (readChoice() !== currentChoice) location.reload();
    };
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === null) refreshIfChanged();
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) refreshIfChanged();
    });

    if (initialChoice) return;
    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-label', 'Согласие на веб-аналитику');
    banner.innerHTML = `
      <div class="cookie-banner__copy">
        <strong>Веб-аналитика</strong>
        <p>С вашего разрешения Яндекс Метрика использует cookies и записывает действия на сайте через Вебвизор. <a href="analytics-consent.html">Текст согласия</a> · <a href="privacy.html">Политика конфиденциальности</a></p>
      </div>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__button cookie-banner__button--muted" type="button" data-consent="declined">Отказаться</button>
        <button class="cookie-banner__button" type="button" data-consent="accepted">Разрешить аналитику</button>
      </div>
      <span role="status"></span>`;
    document.body.append(banner);
    banner.addEventListener('click', event => {
      const button = event.target.closest('[data-consent]');
      if (button) updateChoice(button.dataset.consent, banner.querySelector('[role="status"]'), () => banner.remove());
    });
  }
})();

