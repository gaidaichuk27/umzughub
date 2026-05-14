import './scss/main.scss';

/** Order matters: globals first, then site behavior. */
import './js/globals.js';
import { ensureJQuery, loadScriptOnce, loadCssOnce, OWL_CAROUSEL_JS, OWL_CAROUSEL_CSS, OWL_THEME_CSS } from './js/main-scripts.js';

function initOwlCarousel() {
    var owlEl = document.getElementById('owl-star');
    if (!owlEl) {
        return;
    }

    loadCssOnce(OWL_CAROUSEL_CSS);
    loadCssOnce(OWL_THEME_CSS);

    function activateCarousel() {
        ensureJQuery()
            .then(function () {
                return loadScriptOnce(OWL_CAROUSEL_JS);
            })
            .then(function () {
                var $ = window.jQuery;
                var $owl = $('#owl-star');
                $owl.owlCarousel({
                    items: 1,
                    loop: true,
                    autoplay: false,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    dots: true,
                    nav: false,
                    navText: [
                        '<span aria-label="Vorherige Bewertung">&#x2039;</span>',
                        '<span aria-label="Nächste Bewertung">&#x203a;</span>'
                    ],
                    smartSpeed: 600,
                });
                $owl.find('.owl-nav button').each(function () {
                    if (!this.getAttribute('aria-label')) {
                        this.setAttribute('aria-label',
                            this.classList.contains('owl-prev') ? 'Vorherige Bewertung' : 'Nächste Bewertung');
                    }
                });
                $owl.find('.owl-dot').each(function (i) {
                    this.setAttribute('aria-label', 'Bewertung ' + (i + 1));
                });
            })
            .catch(function (err) { console.error('Owl Carousel init failed:', err); });
    }

    var section = owlEl.closest('section') || owlEl;
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                activateCarousel();
            }
        }, { rootMargin: '400px' });
        observer.observe(section);
    } else {
        activateCarousel();
    }
}

function initTelInputs() {
    document.querySelectorAll('input[type="tel"]').forEach((input) => {
        input.addEventListener('focus', () => {
            if (!input.value) {
                input.value = '+49';
            }
        });

        input.addEventListener('input', () => {
            let numbers = input.value.replace(/\D/g, '');
            if (!numbers.startsWith('49')) {
                numbers = '49' + numbers;
            }
            input.value = '+' + numbers;
        });

        input.addEventListener('blur', () => {
            const numbers = input.value.replace(/\D/g, '');
            if (numbers.length < 10) {
                input.setCustomValidity(
                    'Введите корректный номер (минимум 8 цифр)'
                );
            } else {
                input.setCustomValidity('');
            }
        });
    });
}

function boot() {
    initTelInputs();
    initOwlCarousel();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
