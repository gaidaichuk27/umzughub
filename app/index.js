import './scss/main.scss';

/** Order matters: globals first, then site behavior. */
import './js/globals.js';
import './js/main-scripts.js';

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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
