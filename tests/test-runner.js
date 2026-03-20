// tests/test-runner.js — Minimal browser test runner

const tests = [];
let currentSuite = '';

export function describe(name, fn) {
  currentSuite = name;
  fn();
  currentSuite = '';
}

export function it(name, fn) {
  tests.push({ suite: currentSuite, name, fn });
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected, tolerance = 0.01) {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    },
    toBeNotNull() {
      if (actual === null) throw new Error(`Expected non-null, got null`);
    },
  };
}

export async function runAll() {
  const results = document.getElementById('results');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const label = test.suite ? `${test.suite} > ${test.name}` : test.name;
    try {
      test.fn();
      passed++;
      const div = document.createElement('div');
      div.className = 'pass';
      div.textContent = `PASS: ${label}`;
      results.appendChild(div);
    } catch (err) {
      failed++;
      const div = document.createElement('div');
      div.className = 'fail';
      div.textContent = `FAIL: ${label} — ${err.message}`;
      results.appendChild(div);
    }
  }

  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.textContent = `${passed} passed, ${failed} failed, ${tests.length} total`;
  results.prepend(summary);

  // Set title for easy CI/human check
  document.title = failed === 0 ? 'ALL TESTS PASSED' : `${failed} TESTS FAILED`;
}
