# UniForget — project page

Project page for **Unconsciously Forget: Mitigating Memorization Without Knowing
What is being Memorized** (ECCV 2026 Workshop on Safe World Models for Trustworthy Embodied AI, submission 4866).

Live at <https://jasonjin34.github.io/uniforget_page/>

## Layout

    index.html            the whole page
    static/css/style.css  styles
    static/js/main.js     KaTeX equation rendering, copy-to-clipboard
    static/images/        paper figures at original resolution
    static/pdfs/          paper + appendix downloads (see README there)

## Local preview

    python3 -m http.server 8000     # then open http://localhost:8000

## Before publishing

- Drop the paper and appendix PDFs into `static/pdfs/` and un-mark the
  download cards in the Appendix section.
- Fill in the arXiv and code URLs in the hero (`class="btn pending"`).
- Keep this repository **private** until reviews are back — the page lists
  full author names and the workshop review is double-blind.

## Publishing

Settings -> Pages -> Deploy from a branch -> `main` / `root`.
