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


  /*
    Same words, for fast
    lookup when checking an
    answer.
  */

  wordSet:
    new Set(),

  chain: [],

  level: 0,

  /*
    Letters currently being
    typed into the active row.
  */

  selected: [],

  /*
    Completed words stay here.
  */

  completedWords: [],

  /*
    Three hints total.
  */

  hintsUsed: 0,

  /*
    Hint positions for
    current row.
  */

  hintedPositions:
    new Set(),

  /*
    Current letter rack.
  */

  rack: []

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

        .map(
          word =>
            word
              .trim()
              .toLowerCase()
        )

        .filter(
          word =>
            /^[a-z]+$/.test(word)
        )

        .filter(
          word =>
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


  for (
    const letter
    of word
  ) {

    counts[letter] =
      (
        counts[letter] || 0
      ) + 1;

  }


  return counts;

}


/* =========================
   SAME LETTERS?
========================= */

/*
  True when two words are
  built from exactly the same
  letters, in any order.
*/

function isSameLetters(
  first,
  second
) {

  return (

    [...first]
      .sort()
      .join("") ===

    [...second]
      .sort()
      .join("")

  );

}


/* =========================
   BUILD INDEX
========================= */

function buildIndexes(words) {

  const byLength =
    new Map();


  for (
    const word
    of words
  ) {

    if (
      !byLength.has(
        word.length
      )
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
   FIND CHAIN
========================= */

function findChain(words) {

  const byLength =
    buildIndexes(words);


  const sets =
    new Map();


  for (
    const [
      length,
      list
    ]
    of byLength
  ) {

    sets.set(
      length,
      new Set(list)
    );

  }


  const starts =
    [
      ...(byLength.get(3) || [])
    ]
      .sort(
        () =>
          Math.random() - 0.5
      );


  for (
    const start
    of starts.slice(
      0,
      1500
    )
  ) {

    const chain = [
      start
    ];


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
   DFS CHAIN SEARCH
========================= */

function dfsChain(
  chain,
  sets
) {

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
    sets.get(
      nextLength
    ) || new Set();


  const previousCounts =
    letterCounts(
      previous
    );


  const possible = [];


  for (
    const word
    of candidates
  ) {

    const counts =
      letterCounts(word);


    let valid = true;


    /*
      Every letter in the
      previous word must exist
      in the new word.
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
        (
          counts[letter] || 0
        ) < count
      ) {

        valid = false;

        break;

      }

    }


    if (!valid) continue;


    /*
      Find additional letters.
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

        added.push(
          letter
        );

      }

    }


    /*
      Exactly one new letter.
    */

    if (
      added.length === 1
    ) {

      possible.push(
        word
      );

    }

  }


  possible.sort(
    () =>
      Math.random() - 0.5
  );


  for (
    const next
    of possible.slice(
      0,
      80
    )
  ) {

    chain.push(
      next
    );


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

  return [
    ...array
  ].sort(
    () =>
      Math.random() - 0.5
  );

}


/* =========================
   DISTRACTORS
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


  const newLetters = [];


  /*
    Determine the new letter
    introduced by this row.
  */

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
    Previous word's letters
    are carried forward.
  */

  const carried =
    [...previous];


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
    Carry previous letters.
  */

  for (
    const letter
    of carried
  ) {

    tiles.push({

      letter,

      carried: true,

      id:
        crypto.randomUUID()

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

      id:
        crypto.randomUUID()

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

      id:
        crypto.randomUUID()

    });

  }


  state.rack =
    shuffle(tiles);


  /*
    New active row starts empty.
  */

  state.selected = [];

}


/* =========================
   RENDER PYRAMID
========================= */

function render() {

  /*
    LEVEL DISPLAY
  */

  levelLabel.textContent =
    `${
      state.level + 1
    } / ${LEVELS.length}`;


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
    Clear pyramid.
  */

  answerRows.innerHTML = "";


  /*
    Draw every row that
    has been completed.
  */

  for (
    let rowIndex = 0;
    rowIndex < state.level;
    rowIndex++
  ) {

    renderCompletedRow(
      rowIndex
    );

  }


  /*
    Draw current active row.
  */

  renderActiveRow();


  /*
    Render letter rack.
  */

  renderRack();


  /*
    Selected count.
  */

  selectedCount.textContent =
    `${
      state.selected.length
    } selected`;


  /*
    Hints remaining.
  */

  hintCount.textContent =
    3 - state.hintsUsed;


  hintBtn.disabled =
    state.hintsUsed >= 3;


  /*
    Status.
  */

  if (
    state.level === 0 &&
    !statusEl.classList.contains(
      "error"
    )
  ) {

    statusEl.textContent =
      "Find the hidden 3-letter word.";

  }

  else if (
    state.level > 0 &&
    !statusEl.classList.contains(
      "error"
    )
  ) {

    statusEl.textContent =
      "Use the blue letters and discover the new letter.";

  }

}


/* =========================
   RENDER COMPLETED ROW
========================= */

function renderCompletedRow(
  rowIndex
) {

  const word =
    state.chain[
      rowIndex
    ];


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "answer-row completed";


  /*
    The new letter is the
    letter that wasn't present
    in the previous word.
  */

  let previous = "";


  if (
    rowIndex > 0
  ) {

    previous =
      state.chain[
        rowIndex - 1
      ];

  }


  const previousCounts =
    letterCounts(previous);


  const wordCounts =
    letterCounts(word);


  let newLetterIndex =
    -1;


  for (
    let i = 0;
    i < word.length;
    i++
  ) {

    const letter =
      word[i];


    const usedBefore =
      (
        previousCounts[
          letter
        ] || 0
      );


    const usedCurrent =
      word
        .slice(
          0,
          i
        )
        .split("")
        .filter(
          x =>
            x === letter
        ).length;


    if (
      usedCurrent >=
      usedBefore
    ) {

      /*
        This can be the new
        letter.

        We only mark the first
        genuinely new occurrence.
      */

      const totalPrevious =
        previousCounts[
          letter
        ] || 0;


      const occurrencesSoFar =
        word
          .slice(
            0,
            i + 1
          )
          .split("")
          .filter(
            x =>
              x === letter
          ).length;


      if (
        occurrencesSoFar >
        totalPrevious
      ) {

        newLetterIndex =
          i;

        break;

      }

    }

  }


  /*
    Create boxes.
  */

  for (
    let i = 0;
    i < word.length;
    i++
  ) {

    const box =
      document.createElement(
        "div"
      );


    box.className =
      "answer-box";


    box.textContent =
      word[
        i
      ].toUpperCase();


    /*
      All completed letters
      are blue.

      The newly discovered
      letter is also blue, but
      gets the new-letter class.
    */

    box.classList.add(
      "locked"
    );


    if (
      i === newLetterIndex
    ) {

      box.classList.add(
        "new-letter"
      );

    }


    row.appendChild(
      box
    );

  }


  answerRows.appendChild(
    row
  );

}


/* =========================
   RENDER ACTIVE ROW
========================= */

function renderActiveRow() {

  const target =
    state.chain[
      state.level
    ];


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "answer-row active";


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
      Selected letter.
    */

    if (
      state.selected[i]
    ) {

      box.textContent =
        state.selected[i]
          .letter
          .toUpperCase();


      if (
        state.selected[i]
          .carried
      ) {

        box.classList.add(
          "locked"
        );

      }

      else {

        box.classList.add(
          "current"
        );

      }

    }


    /*
      Hint.
    */

    else if (
      state.hintedPositions
        .has(i)
    ) {

      box.textContent =
        target[
          i
        ].toUpperCase();


      box.classList.add(
        "hinted"
      );

    }


    /*
      Next empty box.
    */

    else if (
      i ===
      state.selected.length
    ) {

      box.classList.add(
        "next"
      );

    }


    row.appendChild(
      box
    );

  }


  answerRows.appendChild(
    row
  );


  /*
    Automatically keep the newest
    row visible as the pyramid grows.
  */

  requestAnimationFrame(
    () => {

      answerRows.scrollTop =
        answerRows.scrollHeight;

    }
  );

}


/* =========================
   RENDER LETTER RACK
========================= */

function renderRack() {

  letterRack.innerHTML = "";


  const target =
    state.chain[
      state.level
    ];


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
        tile.letter
          .toUpperCase();


      /*
        Carried letter.
      */

      if (
        tile.carried
      ) {

        button.classList.add(
          "carried"
        );

      }


      /*
        Is this tile already
        selected?
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

        button.disabled =
          true;

      }


      /*
        Hint highlight.
      */

      if (
        state.hintedPositions.size
        > 0
      ) {

        const firstHint =
          [
            ...state.hintedPositions
          ][0];


        if (
          target[
            firstHint
          ] ===
          tile.letter
        ) {

          button.classList.add(
            "hinted"
          );

        }

      }


      /*
        CLICK
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
    Don't exceed word length.
  */

  if (
    state.selected.length >=
    target.length
  ) {

    return;

  }


  const tile =
    state.rack.find(
      item =>
        item.id === id
    );


  if (!tile) {

    return;

  }


  /*
    Already selected?
  */

  if (
    state.selected.some(
      selected =>
        selected.id === id
    )
  ) {

    return;

  }


  state.selected.push(
    tile
  );


  clearError();

  render();

}


/* =========================
   FIND AVAILABLE TILE
========================= */

function findAvailableTile(
  letter
) {

  return state.rack.find(
    tile => {

      const used =
        state.selected.some(
          selected =>
            selected.id ===
            tile.id
        );


      return (
        tile.letter === letter &&
        !used
      );

    }
  );

}


/* =========================
   KEYBOARD
========================= */

function handleKeyboardInput(
  event
) {

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
    LETTERS ONLY
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


  const target =
    state.chain[
      state.level
    ];


  /*
    Don't exceed word length.
  */

  if (
    state.selected.length >=
    target.length
  ) {

    return;

  }


  const letter =
    event.key.toLowerCase();


  const tile =
    findAvailableTile(
      letter
    );


  /*
    Letter isn't available.
  */

  if (!tile) {

    setStatus(
      `"${letter.toUpperCase()}" isn't available.`,
      "error"
    );

    return;

  }


  state.selected.push(
    tile
  );


  clearError();

  render();

}


/* =========================
   BACKSPACE
========================= */

function removeLastLetter() {

  if (
    state.selected.length ===
    0
  ) {

    return;

  }


  state.selected.pop();


  clearError();

  render();

}


/* =========================
   CURRENT GUESS
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
    The chain picked one answer,
    but the rack usually spells
    others. Any real word made
    from the same letters is
    just as correct, and leaves
    the next row unchanged.
  */

  const accepted =

    guess === target ||

    (
      isSameLetters(
        guess,
        target
      ) &&

      state.wordSet.has(
        guess
      )
    );


  /*
    Wrong answer.
  */

  if (!accepted) {

    setStatus(
      "Not the word we're looking for. Try again.",
      "error"
    );

    return;

  }


  /*
    CORRECT!
    
    Keep the word in the pyramid.
  */

  state.completedWords.push(
    guess
  );


  /*
    Move to next row.
  */

  state.level++;


  /*
    GAME COMPLETE
  */

  if (
    state.level >=
    LEVELS.length
  ) {

    render();

    showWin();

    return;

  }


  /*
    Reset current-row state.
  */

  state.selected = [];


  state.hintedPositions.clear();


  hintText.textContent = "";


  /*
    Create new letter rack
    using the previous word.
  */

  createRack();


  /*
    Success message.
  */

  setStatus(
    "Correct! A new row has been added.",
    "success"
  );


  render();

}


/* =========================
   CLEAR ERROR
========================= */

function clearError() {

  statusEl.classList.remove(
    "error"
  );

}


/* =========================
   STATUS
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
   HINT
========================= */

function useHint() {

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
    HINT 1
    Remove one distractor.
  */

  if (
    state.hintsUsed === 0
  ) {

    const required =
      new Set(
        target.split("")
      );


    const index =
      state.rack.findIndex(
        tile =>
          !required.has(
            tile.letter
          ) &&
          !tile.carried
      );


    if (
      index !== -1
    ) {

      state.rack.splice(
        index,
        1
      );


      state.hintsUsed++;


      hintText.textContent =
        "Hint used: one distractor letter was removed.";

    }

  }


  /*
    HINT 2
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
    HINT 3
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
    state.completedWords
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


  state.selected = [];


  state.completedWords = [];


  state.hintsUsed = 0;


  state.hintedPositions.clear();


  const chain =
    findChain(
      state.words
    );


  if (!chain) {

    setStatus(

      "I couldn't find a 3-to-8 letter chain in this word list.",

      "error"

    );

    return;

  }


  state.chain =
    chain;


  createRack();


  hintText.textContent = "";


  winScreen.classList.add(
    "hidden"
  );


  clearError();


  setStatus(
    "Find the hidden 3-letter word."
  );


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


    state.wordSet =
      new Set(
        state.words
      );


    if (
      state.words.length === 0
    ) {

      throw new Error(
        "The word list is empty."
      );

    }


    startGame();

  }

  catch (error) {

    console.error(
      error
    );


    setStatus(

      "Could not load engwords.txt. Run the project with VS Code Live Server.",

      "error"

    );

  }

}


/* =========================
   EVENTS
========================= */

document.addEventListener(
  "keydown",
  handleKeyboardInput
);


hintBtn.addEventListener(
  "click",
  useHint
);


restartBtn.addEventListener(
  "click",
  startGame
);


playAgainBtn.addEventListener(
  "click",
  startGame
);


/* =========================
   START
========================= */

loadWords();