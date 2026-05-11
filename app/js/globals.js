/**
 * Globals referenced from inline HTML handlers (`onclick`, etc.).
 * Imported before `main-scripts.js` so `window.*` exists as soon as the bundle runs.
 */
window.showPopup = function showPopup(e) {
    e.preventDefault();
    const callbackEl = document.getElementById('calform') || document.querySelector('.callback');
    if (!callbackEl) return;

    // Remember which element opened the dialog so we can restore focus.
    window.__umzughubPopupLastFocus = e && e.currentTarget ? e.currentTarget : document.activeElement;

    const setBackdropHidden = (hidden) => {
        const ids = ['top-adress-2', 'main-content', 'round-footer'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (hidden) el.setAttribute('aria-hidden', 'true');
            else el.removeAttribute('aria-hidden');
        });
    };

    callbackEl.setAttribute('aria-hidden', 'false');
    setBackdropHidden(true);

    callbackEl.classList.add('callback--open');

    // Move focus into the dialog (first meaningful control).
    window.requestAnimationFrame(() => {
        const focusTarget =
            callbackEl.querySelector('#popup-yourName') ||
            callbackEl.querySelector('input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
    });
};

window.closePopup = function closePopup(e) {
    if (e) e.preventDefault();
    const callbackEl = document.getElementById('calform') || document.querySelector('.callback');
    if (!callbackEl) return;

    const setBackdropHidden = (hidden) => {
        const ids = ['top-adress-2', 'main-content', 'round-footer'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (hidden) el.setAttribute('aria-hidden', 'true');
            else el.removeAttribute('aria-hidden');
        });
    };

    callbackEl.setAttribute('aria-hidden', 'true');
    setBackdropHidden(false);

    callbackEl.classList.remove('callback--open');

    const last = window.__umzughubPopupLastFocus;
    window.__umzughubPopupLastFocus = null;
    if (last && typeof last.focus === 'function') {
        window.requestAnimationFrame(() => last.focus());
    }
};

// Escape-to-close + basic focus trap while dialog is open.
document.addEventListener('keydown', function (ev) {
    const callbackEl = document.getElementById('calform');
    if (!callbackEl) return;
    const isOpen = callbackEl.getAttribute('aria-hidden') !== 'true';
    if (!isOpen) return;

    if (ev.key === 'Escape') {
        window.closePopup(ev);
        return;
    }

    if (ev.key !== 'Tab') return;
    const focusables = callbackEl.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (ev.shiftKey && active === first) {
        ev.preventDefault();
        last.focus();
    } else if (!ev.shiftKey && active === last) {
        ev.preventDefault();
        first.focus();
    }
});
