const QUESTION_TIME_LIMIT_SECONDS = 30;

const getRemainingTime = (startTime) => {
  const elapsedMilliseconds = Date.now() - new Date(startTime).getTime();
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
  const remaining = QUESTION_TIME_LIMIT_SECONDS - elapsedSeconds;
  
  return Math.max(0, remaining);
};

const validateAnswerWithinTime = (startTime, gracePeriodSeconds = 2) => {
  const elapsedMilliseconds = Date.now() - new Date(startTime).getTime();
  const maxAllowedTime = (QUESTION_TIME_LIMIT_SECONDS + gracePeriodSeconds) * 1000;
  
  return elapsedMilliseconds <= maxAllowedTime;
};

module.exports = {
  QUESTION_TIME_LIMIT_SECONDS,
  getRemainingTime,
  validateAnswerWithinTime,
};