# Sablé

Landing page for Sablé, a small-batch celebration cake bakery in Bengaluru. It's a single static page: plain HTML, CSS and JavaScript, with [GSAP](https://gsap.com/) and ScrollTrigger for motion. There's no build step and no dependencies to install.

## Run it locally

Serve the folder with any static server, for example:

```bash
python3 -m http.server 5178
```

Then open <http://localhost:5178>. Opening `index.html` straight from disk mostly works, but the fonts and the SVG sprite behave more reliably over HTTP.

## What's on the page

| Section | What it does |
|---|---|
| **Hero** | The cake is set down onto a paper doily, then settles. The headline sits over a leaf-light photo with a vanilla wash. Four accessories (strawberries, chocolate, pistachios, a flower sprig) slide in from the screen edges. |
| **Ribbon** | A raspberry band of flavour names that loops continuously and speeds up when you scroll. It sits on the seam between the hero and the next section. |
| **Cut in** | Pinned on tablet and desktop. Scrolling swaps the whole ganache cake for a cut slice, then shows the price and an "Add to order" button. |
| **Pick your cake** | Product cards with photos that open up as they appear and prices that count up. On desktop the photos tilt toward the cursor. |
| **Story, custom orders, reviews, footer** | Section-specific reveals: the story points draw a raspberry rule, the form fields appear in turn, and the big review fills in word by word as you scroll. |

Faint line motifs (lace, rosettes, flowers, piped zigzags, sprigs) are scattered along the sides of the plain sections, with parallax on scroll and a response to the mouse.

## Project structure

```
index.html          the page, plus an inline SVG sprite of the line motifs (#m-doily, #m-lace, …)
css/styles.css      tokens, layout, sections, motion start states, reduced-motion rules
js/main.js          menu, cart counter, form validation, then all GSAP motion
js/gsap.min.js      GSAP 3.15.1 (local copy)
js/ScrollTrigger.min.js
fonts/              self-hosted Fraunces, Hanken Grotesk and Caveat (woff2)
img/                photos the page uses (.webp)
img/accessories/    trimmed cut-outs for the edge decorations
img/bg/             section backgrounds, each at 2400px and 1200px wide
```

The large `.png` files in `img/` are the originals. The page loads the `.webp` versions made from them, with backgrounds resized and watermarks removed. Keep the originals if you want to re-export.

## Editing notes

- **Browsers holding on to old files.** The stylesheet and script are linked as `styles.css?v=7` and `main.js?v=7`. Bump the number whenever you change either file, or browsers may keep running the old copy.
- **Reduced motion.** All motion is inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`. With reduced motion on, nothing animates and every section shows its final state. Check this after any motion change.
- **The pinned section.** "Cut in" is pinned for an extra 170% of the screen height on desktop. Its ScrollTrigger has `refreshPriority: 1` so it's measured first. Without that, every scroll animation below it fires about a screen and a half early. Keep it if you add more pins.
- **Accessories** (`.acc` in the hero and custom orders) must never cover the headline, buttons or product text. Their sizes are tied to the headline size (`--stage-fs`), so they hold their gaps at every width. Only two show on phones. If you move one, check 1440, 1024 and 390px wide.
- **Background motifs** are placed by `scatterMotifs()` in `main.js`, which keeps them off headings, photos and form controls. To add a new motif, add a `<symbol>` to the sprite in `index.html`. Make sure its `viewBox` contains the whole drawing, or the edges get clipped. Then list the symbol in `MOTIFS`.
- **Reviews are placeholders.** Replace them with real customer quotes (with permission) before launch, then delete the `.reviews__sample` note.
- **Ganache card copy.** The Dark Chocolate Ganache card still mentions fresh strawberries, which its current photo doesn't show.

## Credits

GSAP and ScrollTrigger are © GreenSock, used under the GSAP standard licence. Fonts are under the SIL Open Font License.
