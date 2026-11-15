# The Gray Tutor on a tablet (BOOX, or any Android)

Three ways to read it, from least to most setup:

1. **Reading mode, anywhere.** Tap the round ⤢ button in the corner of any page, or press
   R, or open a link with `?read`. The menus and the "On this page" column go and the
   lesson fills the screen, upright or on its side. ☰ brings the menus back.
2. **As an app.** Open https://abutlabs.github.io/the-gray-tutor/ in Chrome, then
   ⋮ › *Install app* (or *Add to home screen*). The icon opens the tutorial full screen
   in reading mode. Once installed, the app saves the whole site in the background (the
   corner says *Saving for offline… n / total*, then *Ready offline ✓*); after that every
   lesson opens with no network. Each time it opens online it fetches what changed.
3. **Served from the tablet, one tap.** For a whole copy that needs no network at all:
   - in Termux: `pkg install python curl unzip`
   - install Termux:Widget from the same place Termux came from (F-Droid or GitHub)
   - `bash tools/boox/install.sh` (from Termux, or a proot Linux inside it)
   - long-press the home screen › Widgets › Termux:Widget, and place it
   - tap **Gray Tutor**: it fetches the newest site when it has changed, serves it at
     http://127.0.0.1:8765/the-gray-tutor/ and opens it in reading mode.

## Notes with the pen

The pen is fastest in BOOX's own apps, so notes live there rather than in the site:

- **Split screen:** the tutorial on one side, a BOOX Notes notebook on the other. Notes
  sync through BOOX Cloud.
- **The e-book in NeoReader:** the concepts edition (the start page links it) takes
  handwriting on the page and keeps every note in one exportable list.
