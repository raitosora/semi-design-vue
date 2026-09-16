import { afterEach, beforeEach, expect, vi } from "vitest";

let warnings: ReturnType<typeof vi.spyOn>;
let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnings = vi.spyOn(console, "warn");
  errors = vi.spyOn(console, "error");
});
afterEach(() => {
  try {
    expect(warnings.mock.calls, "Unexpected browser console warnings").toEqual(
      [],
    );
    expect(errors.mock.calls, "Unexpected browser console errors").toEqual([]);
  } finally {
    warnings.mockRestore();
    errors.mockRestore();
  }
});
