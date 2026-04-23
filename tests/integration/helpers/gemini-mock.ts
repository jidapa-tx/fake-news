/**
 * Gemini cross-process note
 * -------------------------
 * Because integration tests hit a running Next.js server on localhost:3000,
 * we cannot `vi.mock('@google/genai')` — the mock would only apply inside
 * the Vitest process, not the server. So these tests intentionally assert
 * on response SHAPE (types, status codes, persisted rows) rather than on
 * exact verdict scores returned by Gemini.
 *
 * To run with Gemini fully disabled (faster, deterministic):
 *   1. Stop the dev server
 *   2. Restart with `GEMINI_API_KEY=` unset in the environment
 *   3. The analyzer falls back to score=50 / UNCERTAIN / empty references
 *
 * If the server has a real key set, tests will still pass — they just take
 * longer and produce real AI verdicts. The cleanup step removes all rows
 * regardless.
 */
export const GEMINI_MODE =
  process.env.GEMINI_INTEGRATION_MODE === 'disabled' ? 'disabled' : 'auto';
