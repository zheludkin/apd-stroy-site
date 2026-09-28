// Клик по кнопке Telegram/MAX → уведомление менеджеру в MAX (/api/messenger-click).
// Без cookie и без персональных данных: только какая кнопка, страница и пришёл ли
// посетитель с рекламы (метка из apd59-attribution, её пишет скрипт в <head> index.html).
(function () {
  function fromAd() {
    try {
      var a = JSON.parse(localStorage.getItem('apd59-attribution') || 'null');
      if (!a || !a.ts || Date.now() - a.ts > 21 * 86400 * 1000) return false;
      return Boolean(a.yclid || a.utm_medium === 'cpc');
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    var messenger = /^https:\/\/t\.me\//.test(href) ? 'telegram' : /^https:\/\/max\.ru\//.test(href) ? 'max' : null;
    if (!messenger) return;
    var body = JSON.stringify({ messenger: messenger, page: location.pathname, fromAd: fromAd() });
    try {
      if (!navigator.sendBeacon || !navigator.sendBeacon('/api/messenger-click', new Blob([body], { type: 'application/json' }))) {
        fetch('/api/messenger-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (err) {}
  });
})();
