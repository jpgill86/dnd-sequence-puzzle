var seed, numbers, moveCount, moves, undoneMoves, labels;
const urlParams = new URLSearchParams(window.location.search);
const seedLocked = (urlParams.get('lock-seed') != null);
const puzzleSVG = document.getElementById('puzzle-svg');
const resetButton = document.getElementById('reset-button');
const randomButton = document.getElementById('random-button');
const fullScreenButton = document.getElementById('fullscreen-button');
const leftButton = document.getElementById('left-button');
const swapButton = document.getElementById('swap-button');
const rightButton = document.getElementById('right-button');
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');
const clipboardButton = document.getElementById('clipboard-button');
const moveCounter = document.getElementById('move-counter');

function initialize() {
  labels = Array.from(puzzleSVG.querySelectorAll('#label-1, #label-2, #label-3, #label-4, #label-5, #label-6, #label-7, #label-8, #label-9, #label-10, #label-11, #label-12'));
  setSeed();
}

function setSeed(newSeed) {
  if (newSeed == null) {
    newSeed = (urlParams.get('seed') || Date.now());
  }
  seed = newSeed.toString();
  if (seedLocked) {
    window.history.pushState({'seed': seed}, '', `${window.location.pathname}?seed=${seed}&lock-seed`);
  } else {
    window.history.pushState({'seed': seed}, '', `${window.location.pathname}?seed=${seed}`);
  }
  resetPuzzle();
  return seed;
}

// restore a seed if the user navigates back
addEventListener("popstate", (event) => {setSeed(event.state['seed'])});

function updateMoves(moveType) {
  undoneMoves = [];
  redoButton.classList.add('hide');
  if (moveType == 'Reset') {
      moveCount = 0;
      moves = [];
      moveType += ` (seed=${seed})`;
  } else {
      moveCount += 1;
  }
  moves.push([moveCount, moveType, numbers.slice()]);
}

function updateLabels() {
  labels.map(function(label, i) {
      label.innerHTML = numbers[i];
  });
  moveCounter.innerHTML = `Number of moves: ${moveCount}`;
}

function shuffleArray(array) {
  var myrng = new Math.seedrandom(seed);
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(myrng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

function resetPuzzle() {
  if (seed == 'aswt') {
    // original initial sequence for A Shadow Within Twilight
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10, 12];
  } else {
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    shuffleArray(numbers);
  }
  updateMoves('Reset');
  updateLabels();
  checkSolution();
}

function randomizePuzzle() {
  setSeed(Date.now());
}

function shiftRight() {
  numbers.unshift(numbers.pop());
  updateMoves('Right');
  updateLabels();
  checkSolution();
}

function shiftLeft() {
  numbers.push(numbers.shift());
  updateMoves('Left');
  updateLabels();
  checkSolution();
}

function rotateWheels() {
  [numbers[0], numbers[1]] = [numbers[1], numbers[0]];
  [numbers[2], numbers[3]] = [numbers[3], numbers[2]];
  updateMoves('Swap');
  updateLabels();
  checkSolution();
}

function checkSolution() {
  var numbersCopy = numbers.slice();
  while (numbersCopy[0] != 1) {
    numbersCopy.push(numbersCopy.shift());
  }
  if (JSON.stringify(numbersCopy) == JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
    showToast(`Solved in ${moveCount} moves!`);
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    try {
      document.documentElement.requestFullscreen();
      fullScreenButton.classList.remove('fa-expand')
      fullScreenButton.classList.add('fa-compress')
      fullScreenButton.title = "Exit fullscreen";
    } catch (err) {
      console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
    }
  } else {
    try{
      document.exitFullscreen();
      fullScreenButton.classList.remove('fa-compress')
      fullScreenButton.classList.add('fa-expand')
      fullScreenButton.title = "Expand to fullscreen";
    } catch (err) {
      console.error(`Error attempting to disable fullscreen mode: ${err.message}`);
    }
  }
}

function undoMove() {
  if (moveCount > 0) {
    undoneMoves.push(moves.pop());
    redoButton.classList.remove('hide');
    moveCount = moves[moves.length-1][0];
    numbers = moves[moves.length-1][2].slice();
    updateLabels();
    checkSolution();
  }
}

function redoMove() {
  if (undoneMoves.length > 0) {
    moves.push(undoneMoves.pop());
    moveCount = moves[moves.length-1][0];
    numbers = moves[moves.length-1][2].slice();
    updateLabels();
    checkSolution();
  } else {
    console.log('tried to redo a move when the undoneMoves list was empty!')
  }
  if (undoneMoves.length == 0) {
    redoButton.classList.add('hide');
  }
}

function stringifyArrayPerLine(arr) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array.");
  }

  const stringifiedElements = arr.map(item => JSON.stringify(item));
  return `[\n  ${stringifiedElements.join(',\n  ')}\n]`;
}

function showToast(message, duration = 2000) {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Animate the toast to show
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Hide and remove the toast after the specified duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300); // Small delay to allow fade-out
  }, duration);
}

function copyMovesToClipboard() {
  navigator.clipboard.writeText(stringifyArrayPerLine(moves));
  showToast('Move sequence copied to clipboard');
}

document.addEventListener('DOMContentLoaded', function() {
  randomButton.addEventListener('click', randomizePuzzle);
  resetButton.addEventListener('click', resetPuzzle);
  fullScreenButton.addEventListener('click', toggleFullScreen);
  leftButton.addEventListener('click', shiftLeft);
  swapButton.addEventListener('click', rotateWheels);
  rightButton.addEventListener('click', shiftRight);
  undoButton.addEventListener('click', undoMove);
  redoButton.addEventListener('click', redoMove);
  clipboardButton.addEventListener('click', copyMovesToClipboard);

  if (seedLocked) {
    randomButton.classList.add('hide');
  }

  initialize();
});
