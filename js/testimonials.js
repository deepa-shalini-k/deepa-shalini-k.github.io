(function () {
  'use strict';

  // Hide each screenshot's dashed placeholder once its real image loads.
  var buttons0 = Array.prototype.slice.call(document.querySelectorAll('.tm-shot-btn'));
  buttons0.forEach(function (btn) {
    var img = btn.querySelector('img');
    var placeholder = btn.querySelector('.tm-shot-placeholder');
    if (!img || !placeholder) return;

    function markLoaded() {
      img.classList.add('tm-loaded');
      placeholder.hidden = true;
    }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', function () {
        if (img.naturalWidth > 0) markLoaded();
      });
    }
  });

  // Click-to-enlarge lightbox shared across all cards on the page.
  var dialog = document.getElementById('tm-lightbox');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.tm-shot-btn'));
  if (!dialog || !buttons.length || typeof dialog.showModal !== 'function') return;

  var lightboxImg = dialog.querySelector('img');
  var lastButton = null;

  function open(button) {
    var thumb = button.querySelector('img');
    if (!thumb.classList.contains('tm-loaded')) return;
    lightboxImg.src = thumb.currentSrc || thumb.src;
    lightboxImg.alt = thumb.alt;
    lastButton = button;
    dialog.showModal();
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () { open(button); });
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog || e.target.classList.contains('lightbox-inner')) dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (lastButton) lastButton.focus();
  });
})();
