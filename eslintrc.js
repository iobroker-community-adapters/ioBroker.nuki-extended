module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "indent": ["error", "tab"],
    "linebreak-style": ["error", "windows"],
    "semi": ["error", "always"],
    "brace-style": ["error", "stroustrup"],
    "curly": ["error"],
	"no-unused-vars": ["error", { "varsIgnorePattern": ".*" }],
	"no-undef": ["off"]
  }
};