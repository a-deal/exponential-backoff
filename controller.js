/*
Write a function that performs exponential backoff for a given operation with the following inputs:

1. The operation to execute

2. Duration of backoff periods (colloquially in milliseconds)

3. Criteria for giving up (# of failed retries or elapsed time since original try)

4. Amount of jitter (percentage of current backoff period to vary against, i.e. 50 -> choosing a random timeout value between 0 and half of the current backoff period - derived after exponential backoff is factored in)

Approach:

Check for inputs:
  - Error if operation is not provided
  - Check if specified thresholds have been reached
  - Log defaults / specified values for the others

1. Try the operation

2. If operation fails, calculate the back off period according to
  - Current retry count
    - If greater than # of allowed retries, exit and log termination
    - If elapsed time since initial try is greater than the allowed period, exit and log termination
  - Desired backoff periods
  - Amount of jitter specified

  * Backoff period before jitter = backoff ** Math.pow(2, retrycount)
*/
let begin
let attempts = 0

/**
 * Execute an operation with backoffs for fault tolerance
 * @param {string} op Operation to execute
 * @param {number} backoffPeriod Time basis for retries in milliseconds
 * @param {Object} criteria Thresholds to determine when controller should give up altogether
 * @param {number} jitter Jitter percentage of current backoff period to compute a randomized backoff
 */
export function controller(op, backoffPeriod = 50, criteria = {
  allowedAttemptsCap: 10,
  allowedTimeCap: 10000
}, jitter = 100) {
  if (op === undefined || typeof op !== 'function') {
    console.error(`ERROR: Specified operation is undefined or not a function. Exiting...`)
    process.exit(1)
  }

  if (begin === undefined) {
    begin = Date.now()
  }

  const elapsed = Date.now() - begin

  if (elapsed > criteria.allowedTimeCap || attempts >= criteria.allowedAttemptsCap) {
    console.warn(`WARN: Max retry or Max timeout treshold reached. Exiting...`)
    process.exit(1)
  }

  if (attempts < 1) {
    console.info(`Controller called with:\nOp: ${op.name}\nBackoff Period: ${backoffPeriod}ms\nMax number of retries: ${criteria.allowedAttemptsCap}\nElapsed time cap: ${criteria.allowedTimeCap}ms\nJitter %: ${jitter}`);
  }

  try {
    attempts += 1
    console.log(`Attempting ${op.name}`)
    op()
  } catch (error) {
    const sleep = Math.random() * ((jitter / 100) * (Math.pow(2, attempts) * backoffPeriod))
    console.warn(`Attempt failed, waiting ${sleep}ms before next attempt. ${criteria.allowedAttemptsCap - attempts} attempts left before exiting`)
    setTimeout(controller.apply([op, backoffPeriod, finish, jitter]), sleep)
  }
}
