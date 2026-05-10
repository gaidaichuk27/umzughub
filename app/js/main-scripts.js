const $ = window.jQuery;

// ------- CALLBACK -------//
$(document).ready(function () {
    $('.cme-cls').click(function () {
        if (typeof window.closePopup === 'function') {
            window.closePopup();
        } else {
            $('.callback').fadeOut(100);
        }
    });
});

const formEl = document.querySelector('.form');
if (formEl) {
    formEl.classList.add('animated', 'fadeIn');
}

$('.button').click(function () {
    $('#inbut').val($(this).data('info'));
});

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

let magnificReadyPromise = null;
function ensureMagnificPopup() {
    if (typeof $.fn.magnificPopup === 'function') {
        return Promise.resolve();
    }
    if (!magnificReadyPromise) {
        magnificReadyPromise = loadScriptOnce(
            'https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/jquery.magnific-popup.min.js'
        );
    }
    return magnificReadyPromise;
}

// ------- MOBILE MENU -------//

$('body').click(function () {
    var $nav = $('.navbar-collapse');
    if (typeof $.fn.collapse === 'function') {
        $nav.collapse('hide');
    } else {
        /** Navbar open state is `.show` — works even if Bootstrap plugins failed to attach (dev/order quirks). */
        $nav.removeClass('show');
    }
});

// ------- FIXED MENU (skip if navbar absent — avoids scroll cost on every frame) -------//
(function () {
    var $head = jQuery('#top-head-1');
    if (!$head.length) {
        return;
    }
    jQuery(window).on('scroll', function () {
        var the_top = jQuery(document).scrollTop();
        if (the_top > 100) {
            $head.addClass('fixed');
        } else {
            $head.removeClass('fixed');
        }
    });
})();

// Lazy-load Magnific Popup only when user interacts with gallery (cuts initial TBT).
$(document).on('click', '.magnif-link', function (e) {
    if (typeof $.fn.magnificPopup === 'function') {
        return;
    }
    e.preventDefault();
    const $link = $(this);
    ensureMagnificPopup()
        .then(() => {
            $('.magnif-link').magnificPopup({
                type: 'image',
                gallery: { enabled: true },
            });
            $link.trigger('click');
        })
        .catch(() => {
            // If the plugin fails to load, fall back to default navigation.
            window.location.href = $link.attr('href');
        });
});
