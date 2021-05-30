module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-typescript/base'
    ],
    rules: {
        'no-console': 0,
        'max-len': [1, {
            'code': 140,
            'ignoreComments': true,
            'ignoreTrailingComments': true,
            'ignoreUrls': true,
            'ignoreStrings': true
        }]
    }
};