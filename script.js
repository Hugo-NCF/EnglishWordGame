/* =========================
   GAME SETTINGS
========================= */

const LEVELS = [3, 4, 5, 6, 7, 8];

const DISTRACTORS = 3;


/* =========================
   GAME STATE
========================= */

const state = {

  words: [],

  chain: [],

  level: 0,

  /*
    Letters the player has entered
    into the current answer.
  */
  selected: [],

  /*
    Three hints for the entire game.
  */
  hintsUsed: 0,

  /*
    Positions revealed by hints.
  */
  hintedPositions: new Set(),

  /*
    Current letter tiles.
  */
  rack: [],

  /*
    Words already solved.
  */
  solvedWords: []

};


/* =========================
   DOM ELEMENTS
========================= */

const answerRows =
  document.getElementById(
    "answerRows"
  );


const letterRack =
  document.getElementById(
    "letterRack"
  );


const statusEl =
  document.getElementById(
    "status"
  );


const levelLabel =
  document.getElementById(
    "levelLabel"
  );


const progressBar =
  document.getElementById(
    "progressBar"
  );


const selectedCount =
  document.getElementById(
    "selectedCount"
  );


const hintBtn =
  document.getElementById(
    "hintBtn"
  );


const hintCount =
  document.getElementById(
    "hintCount"
  );


const hintText =
  document.getElementById(
    "hintText"
  );


const restartBtn =
  document.getElementById(
    "restartBtn"
  );


const winScreen =
  document.getElementById(
    "winScreen"
  );


const finalChain =
  document.getElementById(
    "finalChain"
  );


const playAgainBtn =
  document.getElementById(
    "playAgainBtn"
  );


/* =========================
   CLEAN WORD DATABASE
========================= */

function cleanWords(raw) {

  return [
    ...new Set(

      raw
        .split(/\r?\n/)

        .map(word =>
          word
            .trim()
            .toLowerCase()
        )

        .filter(word =>
          /^[a-z]+$/.test(word)
        )

        .filter(word =>
          word.length >= 3 &&
          word.length <= 8
        )

    )
  ];

}


/* =========================
   LETTER COUNTS
========================= */

function letterCounts(word) {

  const counts = {};


  for (const letter of word) {

    counts[letter] =
      (counts[letter] || 0) + 1;

  }


  return counts;

}


/* =========================
   BUILD WORD INDEX
========================= */

function buildIndexes(words) {

  const byLength = new Map();


  for (const word of words) {

    if (
      !byLength.has(word.length)
    ) {

      byLength.set(
        word.length,
        []
      );

    }


    byLength
      .get(word.length)
      .push(word);

  }


  return byLength;

}


/* =========================
   FIND WORD CHAIN
========================= */

function findChain(words) {

  const byLength =
    buildIndexes(words);


  const sets = new Map();


  for (
    const [length, list]
    of byLength
  ) {

    sets.set(
      length,
      new Set(list)
    );

  }


  /*
    Random starting point
    so restarting can create
    a different puzzle.
  */

  const starts =
    [...(
      byLength.get(3) || []
    )]
      .sort(
        () => Math.random() - 0.5
      );


  /*
    Try to find a chain.
  */

  for (
    const start
    of starts.slice(0, 1500)
  ) {

    const chain = [start];


    if (
      dfsChain(
        chain,
        sets
      )
    ) {

      return chain;

    }

  }


  return null;

}


/* =========================
   SEARCH FOR CHAIN
========================= */

function dfsChain(
  chain,
  sets
) {

  /*
    We have reached:

    3
    4
    5
    6
    7
    8

    Success.
  */

  if (
    chain.length ===
    LEVELS.length
  ) {

    return true;

  }


  const previous =
    chain[
      chain.length - 1
    ];


  const nextLength =
    previous.length + 1;


  const candidates =
    sets.get(nextLength) ||
    new Set();


  const previousCounts =
    letterCounts(previous);


  const possible = [];


  /*
    Find words that contain
    every letter of the previous
    word plus exactly one new
    letter.
  */

  for (
    const word
    of candidates
  ) {

    const counts =
      letterCounts(word);


    let valid = true;


    /*
      Previous letters must
      all exist in new word.
    */

    for (
      const [
        letter,
        count
      ]
      of Object.entries(
        previousCounts
      )
    ) {

      if (
        (counts[letter] || 0)
        < count
      ) {

        valid = false;

        break;

      }

    }


    if (!valid) continue;


    /*
      Count new letters.
    */

    const added = [];


    for (
      const [
        letter,
        count
      ]
      of Object.entries(
        counts
      )
    ) {

      const extra =
        count -
        (
          previousCounts[
            letter
          ] || 0
        );


      for (
        let i = 0;
        i < extra;
        i++
      ) {

        added.push(letter);

      }

    }


    /*
      Exactly one new letter.
    */

    if (
      added.length === 1
    ) {

      possible.push(word);

    }

  }


  /*
    Randomize possibilities.
  */

  possible.sort(
    () => Math.random() - 0.5
  );


  /*
    Continue searching.
  */

  for (
    const next
    of possible.slice(0, 80)
  ) {

    chain.push(next);


    if (
      dfsChain(
        chain,
        sets
      )
    ) {

      return true;

    }


    chain.pop();

  }


  return false;

}


/* =========================
   SHUFFLE
========================= */

function shuffle(array) {

  return [...array]
    .sort(
      () => Math.random() - 0.5
    );

}


/* =========================
   GET DISTRACTORS
========================= */

function getDistractors(
  excluded,
  amount
) {

  const alphabet =
    "abcdefghijklmnopqrstuvwxyz"
      .split("");


  return shuffle(

    alphabet.filter(
      letter =>
        !excluded.includes(
          letter
        )
    )

  ).slice(
    0,
    amount
  );

}


/* =========================
   CREATE LETTER RACK
========================= */

function createRack() {

  const target =
    state.chain[
      state.level
    ];


  const previous =
    state.level === 0
      ? ""
      : state.chain[
          state.level - 1
        ];


  const targetCounts =
    letterCounts(target);


  const previousCounts =
    letterCounts(previous);


  /*
    Find the new letter.

    Example:

    LIE

    becomes

    TILE

    New letter = T
  */

  const newLetters = [];


  for (
    const [
      letter,
      count
    ]
    of Object.entries(
      targetCounts
    )
  ) {

    const extra =
      count -
      (
        previousCounts[
          letter
        ] || 0
      );


    for (
      let i = 0;
      i < extra;
      i++
    ) {

      newLetters.push(
        letter
      );

    }

  }


  /*
    Previous letters are
    carried into the next level.
  */

  const carried =
    [...previous];


  /*
    Don't use duplicate
    distractors that could
    cause confusion.
  */

  const excluded = [
    ...new Set([
      ...carried,
      ...newLetters
    ])
  ];


  const distractors =
    getDistractors(
      excluded,
      DISTRACTORS
    );


  const tiles = [];


  /*
    Add carried letters.
  */

  for (
    const letter
    of carried
  ) {

    tiles.push({

      letter,

      carried: true,

      id: crypto.randomUUID()

    });

  }


  /*
    Add new letter.
  */

  for (
    const letter
    of newLetters
  ) {

    tiles.push({

      letter,

      carried: false,

      id: crypto.randomUUID()

    });

  }


  /*
    Add distractors.
  */

  for (
    const letter
    of distractors
  ) {

    tiles.push({

      letter,

      carried: false,

      id: crypto.randomUUID()

    });

  }


  /*
    Shuffle the available
    letters.
  */

  state.rack =
    shuffle(tiles);


  /*
    Start with empty answer.
  */

  state.selected = [];

}


/* =========================
   RENDER GAME
========================= */

function render() {

  const target =
    state.chain[
      state.level
    ];


  /*
    LEVEL
  */

  levelLabel.textContent =
    `LEVEL ${
      state.level + 1
    }`;


  /*
    PROGRESS
  */

  progressBar.style.width =
    `${
      (
        (state.level + 1) /
        LEVELS.length
      ) * 100
    }%`;


  /*
    ANSWER BOXES
  */

  answerRows.innerHTML = "";


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "answer-row";


  for (
    let i = 0;
    i < target.length;
    i++
  ) {

    const box =
      document.createElement(
        "div"
      );


    box.className =
      "answer-box";


    /*
      If the player has typed
      or clicked a letter.
    */

    if (
      state.selected[i]
    ) {

      box.textContent =
        state.selected[i].letter
          .toUpperCase();


      /*
        Blue carried letter.
      */

      if (
        state.selected[i].carried
      ) {

        box.classList.add(
          "locked"
        );

      }

      /*
        Normal selected letter.
      */

      else {

        box.classList.add(
          "current"
        );

      }

    }


    /*
      Hint revealed letter.
    */

    else if (
      state.hintedPositions.has(i)
    ) {

      box.textContent =
        target[i].toUpperCase();


      box.classList.add(
        "hinted"
      );

    }


    /*
      Highlight the next
      empty box.
    */

    else if (
      i === state.selected.length
    ) {

      box.classList.add(
        "next"
      );

    }


    row.appendChild(box);

  }


  answerRows.appendChild(row);


  /*
    AVAILABLE LETTERS
  */

  letterRack.innerHTML = "";


  state.rack.forEach(
    tile => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "letter";


      button.type =
        "button";


      button.textContent =
        tile.letter.toUpperCase();


      /*
        Blue carried tile.
      */

      if (
        tile.carried
      ) {

        button.classList.add(
          "carried"
        );

      }


      /*
        Has this specific tile
        already been used?
      */

      const used =
        state.selected.some(
          selected =>
            selected.id ===
            tile.id
        );


      if (used) {

        button.classList.add(
          "used"
        );

        button.disabled = true;

      }


      /*
        Hint highlight.
      */

      if (
        state.hintedPositions.size > 0
      ) {

        const hintedIndex =
          [
            ...state.hintedPositions
          ][0];


        if (
          target[
            hintedIndex
          ] === tile.letter
        ) {

          button.classList.add(
            "hinted"
          );

        }

      }


      /*
        Clicking a tile.
      */

      button.addEventListener(
        "click",
        () => {

          selectTile(
            tile.id
          );

        }
      );


      letterRack.appendChild(
        button
      );

    }
  );


  /*
    SELECTED COUNT
  */

  selectedCount.textContent =
    `${
      state.selected.length
    } selected`;


  /*
    HINT COUNT
  */

  hintCount.textContent =
    3 - state.hintsUsed;


  hintBtn.disabled =
    state.hintsUsed >= 3;


  /*
    STATUS
  */

  if (
    state.level === 0
  ) {

    statusEl.textContent =
      "Find the hidden 3-letter word.";

  }

  else {

    statusEl.textContent =
      "Use the blue letters and discover the new letter.";

  }

}


/* =========================
   SELECT TILE
========================= */

function selectTile(id) {

  const target =
    state.chain[
      state.level
    ];


  /*
    Don't allow more letters
    than the answer requires.
  */

  if (
    state.selected.length >=
    target.length
  ) {

    return;

  }


  /*
    Find clicked tile.
  */

  const tile =
    state.rack.find(
      item =>
        item.id === id
    );


  if (!tile) {

    return;

  }


  /*
    Don't select the same
    tile twice.
  */

  if (
    state.selected.some(
      selected =>
        selected.id === id
    )
  ) {

    return;

  }


  /*
    Add it to the answer.
  */

  state.selected.push(tile);


  render();

}


/* =========================
   GET CURRENT GUESS
========================= */

function currentGuess() {

  return state.selected
    .map(
      tile =>
        tile.letter
    )
    .join("");

}


/* =========================
   FIND AVAILABLE TILE
========================= */

function findAvailableTile(
  letter
) {

  /*
    Find a tile with this
    letter that hasn't already
    been used.
  */

  return state.rack.find(
    tile => {

      const alreadyUsed =
        state.selected.some(
          selected =>
            selected.id ===
            tile.id
        );


      return (
        tile.letter ===
        letter &&
        !alreadyUsed
      );

    }
  );

}


/* =========================
   KEYBOARD INPUT
========================= */

function handleKeyboardInput(
  event
) {

  /*
    Don't allow keyboard
    input while the win screen
    is showing.
  */

  if (
    !winScreen.classList.contains(
      "hidden"
    )
  ) {

    return;

  }


  /*
    ENTER
  */

  if (
    event.key === "Enter"
  ) {

    event.preventDefault();

    submitGuess();

    return;

  }


  /*
    BACKSPACE
  */

  if (
    event.key === "Backspace"
  ) {

    event.preventDefault();

    removeLastLetter();

    return;

  }


  /*
    Only accept letters.
  */

  if (
    event.key.length !== 1 ||
    !/^[a-zA-Z]$/.test(
      event.key
    )
  ) {

    return;

  }


  event.preventDefault();


  /*
    Don't allow more letters
    than the word requires.
  */

  const target =
    state.chain[
      state.level
    ];


  if (
    state.selected.length >=
    target.length
  ) {

    return;

  }


  const letter =
    event.key.toLowerCase();


  /*
    Find a currently available
    tile with this letter.
  */

  const tile =
    findAvailableTile(
      letter
    );


  /*
    If the letter isn't
    available, do nothing.
  */

  if (!tile) {

    /*
      Small error feedback.
    */

    setStatus(
      `"${letter.toUpperCase()}" isn't available.`,
      "error"
    );

    return;

  }


  /*
    Add the physical tile
    to the answer.
  */

  state.selected.push(
    tile
  );


  render();

}


/* =========================
   REMOVE LAST LETTER
========================= */

function removeLastLetter() {

  /*
    Nothing to remove.
  */

  if (
    state.selected.length === 0
  ) {

    return;

  }


  /*
    Remove the last selected
    tile.

    The tile automatically
    becomes available again
    because it is no longer
    in state.selected.
  */

  state.selected.pop();


  render();

}


/* =========================
   SUBMIT GUESS
========================= */

function submitGuess() {

  const target =
    state.chain[
      state.level
    ];


  const guess =
    currentGuess();


  /*
    Not enough letters.
  */

  if (
    guess.length <
    target.length
  ) {

    setStatus(
      `You need ${target.length} letters.`,
      "error"
    );

    return;

  }


  /*
    Wrong word.
  */

  if (
    guess !== target
  ) {

    setStatus(
      "Not the word we're looking for. Try again.",
      "error"
    );

    /*
      Keep their letters there
      so they can use Backspace
      and correct the word.
    */

    return;

  }


  /*
    CORRECT
  */

  state.solvedWords.push(
    target
  );


  /*
    Move to next level.
  */

  state.level++;


  /*
    GAME COMPLETE
  */

  if (
    state.level >=
    LEVELS.length
  ) {

    showWin();

    return;

  }


  /*
    Reset hints for the
    current level only.

    IMPORTANT:
    hintsUsed stays the same
    because the game only gives
    three hints total.
  */

  state.hintedPositions.clear();


  hintText.textContent = "";


  /*
    Generate next rack.
  */

  createRack();


  /*
    Correct message.
  */

  setStatus(
    "Correct! The letters are carrying into the next level.",
    "success"
  );


  render();

}


/* =========================
   STATUS MESSAGE
========================= */

function setStatus(
  text,
  type = ""
) {

  statusEl.textContent =
    text;


  statusEl.className =
    "status";


  if (type) {

    statusEl.classList.add(
      type
    );

  }

}


/* =========================
   HINT SYSTEM
========================= */

function useHint() {

  /*
    No hints left.
  */

  if (
    state.hintsUsed >= 3
  ) {

    return;

  }


  const target =
    state.chain[
      state.level
    ];


  /*
    HINT #1

    Remove one distractor.
  */

  if (
    state.hintsUsed === 0
  ) {

    const required =
      new Set(
        target.split("")
      );


    const distractorIndex =
      state.rack.findIndex(
        tile =>
          !required.has(
            tile.letter
          ) &&
          !tile.carried
      );


    if (
      distractorIndex !== -1
    ) {

      state.rack.splice(
        distractorIndex,
        1
      );


      state.hintsUsed++;


      hintText.textContent =
        "Hint used: one distractor letter was removed.";

    }

  }


  /*
    HINT #2

    Reveal first letter.
  */

  else if (
    state.hintsUsed === 1
  ) {

    state.hintedPositions.add(
      0
    );


    state.hintsUsed++;


    hintText.textContent =
      `Hint used: the first letter is "${target[0].toUpperCase()}".`;

  }


  /*
    HINT #3

    Reveal second letter.
  */

  else if (
    state.hintsUsed === 2
  ) {

    state.hintedPositions.add(
      1
    );


    state.hintsUsed++;


    hintText.textContent =
      `Hint used: the second letter is "${target[1].toUpperCase()}".`;

  }


  render();

}


/* =========================
   WIN SCREEN
========================= */

function showWin() {

  finalChain.textContent =
    state.solvedWords
      .map(
        word =>
          word.toUpperCase()
      )
      .join(" → ");


  winScreen.classList.remove(
    "hidden"
  );

}


/* =========================
   START GAME
========================= */

function startGame() {

  state.level = 0;


  state.hintsUsed = 0;


  state.hintedPositions.clear();


  state.solvedWords = [];


  /*
    Find a new chain.
  */

  const chain =
    findChain(
      state.words
    );


  /*
    No chain found.
  */

  if (!chain) {

    setStatus(

      "I couldn't find a 3-to-8 letter chain in this word list. Try again or add more words.",

      "error"

    );

    return;

  }


  /*
    Store chain.
  */

  state.chain =
    chain;


  /*
    Build first rack.
  */

  createRack();


  /*
    Clear hints.
  */

  hintText.textContent = "";


  /*
    Hide win screen.
  */

  winScreen.classList.add(
    "hidden"
  );


  /*
    Render.
  */

  render();

}


/* =========================
   LOAD WORD DATABASE
========================= */

async function loadWords() {

  try {

    const response =
      await fetch(
        "engwords.txt"
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Could not load engwords.txt"
      );

    }


    const raw =
      await response.text();


    state.words =
      cleanWords(raw);


    /*
      Make sure we have words.
    */

    if (
      state.words.length === 0
    ) {

      throw new Error(
        "The word list is empty."
      );

    }


    /*
      Start game.
    */

    startGame();

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(

      "Could not load engwords.txt. Run this project with VS Code Live Server instead of opening index.html directly.",

      "error"

    );

  }

}


/* =========================
   GLOBAL KEYBOARD LISTENER
========================= */

document.addEventListener(
  "keydown",
  handleKeyboardInput
);


/* =========================
   BUTTONS
========================= */


/*
  HINT
*/

hintBtn.addEventListener(
  "click",
  useHint
);


/*
  RESTART
*/

restartBtn.addEventListener(
  "click",
  startGame
);


/*
  PLAY AGAIN
*/

playAgainBtn.addEventListener(
  "click",
  startGame
);


/* =========================
   START GAME
========================= */

loadWords();