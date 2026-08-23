module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'docs',
        'style',
        'test',
        'perf',
        'ci',
        'chore',
        'build',
        'revert',
      ]
    ],
    'scope-case': [2, 'always', 'kebab-case'],
  }
};
