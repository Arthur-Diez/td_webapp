// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('rrule', () => {
  const weekdayKeys = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const RRule = weekdayKeys.reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {});

  class MockRRuleSet {
    rrule() {}
    exdate() {}
    rdate() {}
    all() {
      return [];
    }
  }

  const rrulestr = () => ({
    all: () => [],
    options: {},
  });

  return { RRule, RRuleSet: MockRRuleSet, rrulestr };
});