## Developer guide

##### Before you start
1. Install [Node.js](//github.com/nodejs/node) (version >= 6.9) via:
  - [nvm](//github.com/creationix/nvm) (Linux/Mac)
  - [Node.js official website](//nodejs.org/en/download/) (Windows)

2. `cd` to your workspace and install all dependencies

  ```
  npm install
  ```

##### Commands
1. build

  ```
  npm run build
  ```

  To build the whole extension and output a zip file ([version in package.json].zip) for uploading to Chrome Web Store

2. dev

  ```
  npm run dev
  ```

  To make a temporary folder `__dev` for you to load unpacked extension
  - ES6 JavaScript to ES5 JavaScript by [Babel](//github.com/babel/babel)
  - CSS4 to CSS3 by [postcss-cssnext](//github.com/MoOx/postcss-cssnext)
  - *.pug to *.html by [Pug](//github.com/pugjs/pug)

3. help

  ```
  npm run help
  ```

  Display developer guide on terminal

4. lint

  ```
  npm run lint
  ```

  To lint
  - ES6 JavaScript code by [ESLint](//github.com/eslint/eslint)
  - CSS4 code by [Stylelint](//github.com/stylelint/stylelint)

5. md

  ```
  npm run md
  ```

  To generate markdown file on the current directory
  - `__store.md` - Description for Chrome Web Store
  - `README.md` - Description for GitHub
