// Game logic functions for volleyball scoring

export const isControlBall = (score1: number, score2: number): boolean => {
  const maxScore = 25;

  // Check if one team is at 24 points and the other has less than 24
  if ((score1 === 24 && score2 < 24) || (score2 === 24 && score1 < 24)) {
    return true;
  }

  // Check if one team can win with the next point in a deuce situation
  if (
    (score1 >= maxScore - 1 || score2 >= maxScore - 1) &&
    Math.abs(score1 - score2) === 1
  ) {
    return true;
  }

  return false;
};

export const isMatchOver = (score1: number, score2: number): boolean => {
  const winningScore = 25;
  const minDifference = 2;

  // Check if one team has reached the winning score and has at least a 2-point lead
  if (
    (score1 >= winningScore || score2 >= winningScore) &&
    Math.abs(score1 - score2) >= minDifference
  ) {
    return true;
  }

  return false;
};

// Additional game logic functions

// Check if the game is in deuce (scores are tied at 24 or above)
export const isDeuce = (score1: number, score2: number): boolean => {
  return score1 >= 24 && score2 >= 24 && score1 === score2;
};

// Get the winner of the match (null if no winner yet)
export const getWinner = (
  score1: number,
  score2: number
): "left" | "right" | null => {
  if (isMatchOver(score1, score2)) {
    return score1 > score2 ? "left" : "right";
  }
  return null;
};

// Check if a score is at match point
export const isMatchPoint = (score1: number, score2: number): boolean => {
  const winningScore = 25;

  // Team 1 is at match point
  if (score1 >= winningScore - 1 && score1 - score2 >= 1) {
    return true;
  }

  // Team 2 is at match point
  if (score2 >= winningScore - 1 && score2 - score1 >= 1) {
    return true;
  }

  return false;
};

// Get the current game state description
export const getGameState = (score1: number, score2: number): string => {
  if (isMatchOver(score1, score2)) {
    const winner = getWinner(score1, score2);
    return `Match over - ${winner} team wins`;
  }

  if (isDeuce(score1, score2)) {
    return "Deuce";
  }

  if (isMatchPoint(score1, score2)) {
    return "Match point";
  }

  if (isControlBall(score1, score2)) {
    return "Control ball";
  }

  return "In progress";
};

// Validate score inputs
export const isValidScore = (score: number): boolean => {
  return Number.isInteger(score) && score >= 0 && score <= 50; // Reasonable upper limit
};

// Check if scores are valid together
export const areValidScores = (score1: number, score2: number): boolean => {
  if (!isValidScore(score1) || !isValidScore(score2)) {
    return false;
  }

  // If one team has 25+, the other should be within reasonable range
  if (score1 >= 25 || score2 >= 25) {
    const diff = Math.abs(score1 - score2);
    // Maximum realistic difference in volleyball
    return diff <= 25;
  }

  return true;
};
