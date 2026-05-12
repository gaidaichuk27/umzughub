/** Site behaviour — vanilla DOM (jQuery loads only when opening the Magnific gallery). */

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

const JQUERY_SLIM =
    'https://code.jquery.com/jquery-3.7.1.slim.min.js';
const MAGNIFIC_CSS =
    'https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/magnific-popup.css';
const MAGNIFIC_JS =
    'https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/jquery.magnific-popup.min.js';

function loadCssOnce(href) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
        }
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        l.onload = () => resolve();
        l.onerror = () => reject(new Error(`Failed to load ${href}`));
        document.head.appendChild(l);
    });
}

function ensureJQuery() {
    if (window.jQuery) {
        return Promise.resolve();
    }
    return loadScriptOnce(JQUERY_SLIM).then(() => {});
}

let magnificReadyPromise = null;
function ensureMagnificPopup() {
    const $ = window.jQuery;
    if ($ && typeof $.fn.magnificPopup === 'function') {
        return Promise.resolve();
    }
    if (!magnificReadyPromise) {
        magnificReadyPromise = ensureJQuery()
            .then(() =>
                Promise.all([
                    loadCssOnce(MAGNIFIC_CSS),
                    loadScriptOnce(MAGNIFIC_JS),
                ])
            )
            .then(() => {});
    }
    return magnificReadyPromise;
}

// ------- CALLBACK -------//
document.querySelectorAll('.cme-cls').forEach((el) => {
    el.addEventListener('click', () => {
        if (typeof window.closePopup === 'function') {
            window.closePopup();
        } else {
            document
                .querySelector('.callback')
                ?.classList.remove('callback--open');
        }
    });
});

const formEl = document.querySelector('.form');
if (formEl) {
    formEl.classList.add('animated', 'fadeIn');
}

document.querySelectorAll('.button').forEach((btn) => {
    btn.addEventListener('click', () => {
        const inbut = document.getElementById('inbut');
        if (inbut && btn.dataset.info !== undefined) {
            inbut.value = btn.dataset.info;
        }
    });
});

// ------- MOBILE MENU -------//
document.body.addEventListener('click', () => {
    const nav = document.querySelector('.navbar-collapse');
    if (nav) {
        nav.classList.remove('show');
    }
});

// ------- FIXED MENU -------//
(function () {
    const head = document.getElementById('top-head-1');
    if (!head) {
        return;
    }
    window.addEventListener('scroll', function () {
        const top =
            window.pageYOffset || document.documentElement.scrollTop || 0;
        if (top > 100) {
            head.classList.add('fixed');
        } else {
            head.classList.remove('fixed');
        }
    });
})();

// ------- Gallery: jQuery + Magnific loaded on first open only -------//
document.addEventListener('click', function (e) {
    const link = e.target.closest('.magnif-link');
    if (!link) {
        return;
    }
    const $ = window.jQuery;
    if ($ && typeof $.fn.magnificPopup === 'function') {
        return;
    }
    e.preventDefault();
    const href = link.getAttribute('href') || '';
    ensureMagnificPopup()
        .then(() => {
            const jq = window.jQuery;
            jq('.magnif-link').magnificPopup({
                type: 'image',
                gallery: { enabled: true },
            });
            jq(link).trigger('click');
        })
        .catch(() => {
            window.location.href = href;
        });
});
