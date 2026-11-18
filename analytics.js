(() => {
  const key = 'site-analytics-consent-v1';
  const counter = 113366309;
  const year = 365 * 24 * 60 * 60 * 1000;
  const settings = document.querySelector('#analytics-controls');

  function readChoice() {
    try {
      const choice = JSON.parse(localStorage.getItem(key));
      if (choice && Date.now() - choice.at < year) return choice.value;
    } catch {
      // Если хранилище недоступно, аналитика остаётся выключенной.
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

  function choose(value) {
    try {
      localStorage.setItem(key, JSON.stringify({ value, at: Date.now() }));
    } catch {
      return false;
    }
    currentChoice = value;
    applyChoice();
    return true;
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
      if (choose(button.dataset.consent)) showStatus();
      else status.textContent = 'Браузер не позволяет сохранить выбор.';
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
      </div>`;
    document.body.append(banner);
    banner.addEventListener('click', event => {
      const button = event.target.closest('[data-consent]');
      if (button && choose(button.dataset.consent)) banner.remove();
    });
  }
})();

