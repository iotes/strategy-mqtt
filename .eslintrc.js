module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jest/globals": true
    },
    "extends": [
        "airbnb-base"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "jest"
    ],
    "rules": {
        "semi": ["error", "never", { "beforeStatementContinuationChars": "always"}],
        "no-console": 0,
        "import/extensions": 0,
        "import/no-unresolved": 0,
        "no-unused-vars": 0,
        "import/prefer-default-export": 0,
        "indent": ["error", 2],
    }
};