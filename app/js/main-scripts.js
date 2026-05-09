const $ = window.jQuery;

// ------- CALLBACK -------//
$(document).ready(function () {
    $('.cme-cls').click(function () {
        $('.callback').fadeOut(100);
    });
});

const formEl = document.querySelector('.form');
if (formEl) {
    formEl.classList.add('animated', 'fadeIn');
}

$('.button').click(function () {
    $('#inbut').val($(this).data('info'));
});

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

// ------- FIXED MENU -------//
jQuery(window).scroll(function () {
    var the_top = jQuery(document).scrollTop();
    if (the_top > 100) {
        jQuery('#top-head-1').addClass('fixed');
    } else {
        jQuery('#top-head-1').removeClass('fixed');
    }
});

$('.magnif-link').magnificPopup({
    type: 'image',
    gallery: {
        enabled: true,
    },
});
