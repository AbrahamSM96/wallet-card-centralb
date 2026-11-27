const MAX_ERROR_CAUSE_DEPTH = 8

/**
 * Detects a PostgreSQL unique violation through wrapped error causes.
 *
 * @param error - Unknown database error.
 * @param constraintName - Expected PostgreSQL constraint name.
 */
export function isUniqueViolation(
  error: unknown,
  constraintName: string
): boolean {
  let currentError = error

  for (let depth = 0; depth < MAX_ERROR_CAUSE_DEPTH; depth += 1) {
    if (typeof currentError !== 'object' || currentError === null) return false

    const candidate = currentError as {
      cause?: unknown
      code?: unknown
      constraint_name?: unknown
    }

    if (
      candidate.code === '23505' &&
      candidate.constraint_name === constraintName
    ) {
      return true
    }

    currentError = candidate.cause
  }

  return false
}
