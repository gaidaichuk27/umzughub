/**
 * Globals referenced from inline HTML handlers (`onclick`, etc.).
 * Imported before `main-scripts.js` so `window.*` exists as soon as the bundle runs.
 */
window.showPopup = function showPopup(e) {
    e.preventDefault();
    const $ = window.jQuery;
    if ($) {
        $('.callback').fadeIn(100);
    }
};
