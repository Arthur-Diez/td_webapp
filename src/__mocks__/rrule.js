const weekdayKeys = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export const RRule = weekdayKeys.reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {});

export class RRuleSet {
  rrule() {}
  exdate() {}
  rdate() {}
  all() {
    return [];
  }
}

export const rrulestr = () => ({
  all: () => [],
  options: {},
});

const defaultExport = { RRule, RRuleSet, rrulestr };

// Support both ESM and CommonJS consumers
export default defaultExport;

if (typeof module !== 'undefined') {
  // eslint-disable-next-line no-undef
  module.exports = defaultExport;
}