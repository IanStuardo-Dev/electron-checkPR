module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist/', 'node_modules/', 'test-results/', 'coverage/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-constant-condition': 'off',
    'no-useless-escape': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/services/**', '**/main/**'],
              message: 'Renderer no debe importar capas externas; usa shared/core o la API publica de la feature.',
            },
          ],
        }],
      },
    },
    {
      files: ['tests/**/*.js', '*.cjs', '*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
