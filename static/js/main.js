/* UniForget — project page: equation rendering and BibTeX copy. */

(function () {
  'use strict';

  function renderMath() {
    if (typeof katex === 'undefined') return;

    document.querySelectorAll('.eq[data-tex]').forEach(function (el) {
      try {
        katex.render(el.getAttribute('data-tex'), el, { displayMode: true, throwOnError: false });
      } catch (err) {
        el.textContent = el.getAttribute('data-tex');
      }
    });

    document.querySelectorAll('.tex').forEach(function (el) {
      try {
        katex.render(el.textContent, el, { displayMode: false, throwOnError: false });
      } catch (err) { /* leave the LaTeX source visible */ }
    });
  }

  if (document.readyState === 'complete') renderMath();
  else window.addEventListener('load', renderMath);

  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-copy'));
      if (!target) return;
      navigator.clipboard.writeText(target.textContent.trim()).then(function () {
        btn.textContent = 'Copied';
        window.setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      }).catch(function () {
        btn.textContent = 'Select and copy';
      });
    });
  });
})();
