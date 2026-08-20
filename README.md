# Word Chain Game

## Files

- `index.html` — game interface
- `style.css` — styling
- `script.js` — game logic
- `engwords.txt` — your word database

## How to run in VS Code

The browser needs to fetch `engwords.txt`, so do not simply double-click `index.html`.

### Recommended

1. Open this folder in VS Code.
2. Install the **Live Server** extension if you do not already have it.
3. Right-click `index.html`.
4. Click **Open with Live Server**.

The game will load the word database automatically.

## Game logic

The game searches the dictionary for a chain where each next answer is exactly one letter longer than the previous answer and contains all of its letters.

Example:

`lie` → `tile`

The order can change because the player has to rearrange the available letters.

Each level provides:

- The previous word's letters as blue carried letters.
- The one new letter needed for the answer.
- Three distractor letters.

The first level has six letters total: three answer letters and three distractors.

There are three hints for the entire game:

1. Remove one distractor.
2. Reveal the first letter.
3. Reveal the second letter.
