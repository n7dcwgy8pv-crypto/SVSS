/**
 * Extracts a human-readable error message from any thrown value.
 * Handles Axios errors (including the { success: false, message, errors[] } envelope),
 * plain Error objects, and unknown values.
 */
export function getErrorMessage(error) {
  // Axios error — check the response body first
  if (error?.response?.data) {
    const body = error.response.data
    // Field-level errors array — join them all
    if (Array.isArray(body.errors) && body.errors.length) {
      return body.errors.map((e) => e.message || e).join('\n')
    }
    // Top-level message from the server envelope
    if (typeof body.message === 'string') return body.message
  }
  // Axios network/timeout error (no response)
  if (error?.message) return error.message
  // Fallback
  return 'An unexpected error occurred. Please try again.'
}
