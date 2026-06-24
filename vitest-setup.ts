// Runs once before the test suite (see `test.setupFiles` in vite.config.ts).
//
// This single import registers jest-dom's custom matchers on Vitest's `expect`,
// so tests can assert things like `expect(el).toBeVisible()` and
// `expect(el).toHaveAttribute('aria-valuenow', '50')`.
//
// (Per-test DOM cleanup is handled automatically by the svelteTesting() plugin,
// so there's nothing else to do here.)
import '@testing-library/jest-dom/vitest';
