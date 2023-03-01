window.onload = function() {
  // your JavaScript code goes here


  const players = [
  {name: 'Player 1', score: 501},
  {name: 'Player 2', score: 501}
];

let currentPlayer = players[0];
let currentScore = 0;

const playerScoreElements = document.querySelectorAll('.player-score');
playerScoreElements.forEach((element, index) => {
  element.textContent = players[index].score;
});

const currentTurnElement = document.querySelector('.player-turn');
const keypadDisplayElement = document.getElementById('keypad-display');

function updateScore() {
  if (currentScore > 180) {
    alert('Invalid score - maximum possible score in one turn is 180!');
    currentScore = 0;
    keypadDisplayElement.textContent = currentScore;
    return;
  }
  currentPlayer.score -= currentScore;
  if (currentPlayer.score === 0) {
    alert(`${currentPlayer.name} wins!`);
  } else if (currentPlayer.score < 0 || currentPlayer.score === 1) {
    currentPlayer.score += currentScore;
    alert('Bust!');
  } else if (currentPlayer.score % 2 === 1 && currentScore % 2 === 0) {
    currentPlayer.score += currentScore;
    alert('Score must end on a double!');
  } else {
    currentPlayer = (currentPlayer === players[0]) ? players[1] : players[0];
    currentTurnElement.textContent = currentPlayer.name;
  }
  currentScore = 0;
  keypadDisplayElement.textContent = currentScore;
  playerScoreElements.forEach((element, index) => {
    element.textContent = players[index].score;
  });
}


const keypadButtons = document.querySelectorAll('.keypad-button');

keypadButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const buttonValue = button.value;
    if (!isNaN(buttonValue)) {
      currentScore = currentScore * 10 + parseInt(buttonValue);
    } else if (buttonValue === 'C') {
      currentScore = 0;
    } else if (buttonValue === '=') {
      updateScore();
    }
    keypadDisplayElement.textContent = currentScore;
  });
});


}

