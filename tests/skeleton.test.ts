import { expect, test } from 'vitest';

test('test runner is ready', () => {
  expect(import.meta.env.MODE).toBe('test');
});
