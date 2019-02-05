# Express Variable [<img src="https://jonathantneal.github.io/node-logo.svg" alt="" width="90" height="90" align="right">][Express Variable]

[![NPM Version][npm-img]][npm-url]
[![Build Status][cli-img]][cli-url]
[![Support Chat][git-img]][git-url]

[Express Variable] lets you automatically transform CSS and JS in [Express]
using [Babel] and [PostCSS].

### Installation

```sh
npm install express-variable
```

### Example

```js
const express = require('express');
const expressVariable = require('express-variable');

const app = express();

app.use(expressVariable('public', {
  js: {
    plugins: [ /* babel plugins go here */ ],
    presets: [ /* babel presets go here */ ],
    sourceMaps: 'inline'
    /* more babel transform options go here */
  },
  css: {
    plugins: [ /* postcss plugins go here */ ],
    map: {
      inline: true
    }
    /* more postcss process options go here */
  }
}));
```

Transformations are cached by the original filename’s modified time.

## Usage

Add [Express Variable] to your project:

```bash
npm install express-variable --save-dev
```

## Options

The first argument determines the directory being watched. The second option configures the transformers; [Babel] and [PostCSS].

### js

The `js` option configures [Babel] and its transform options.

#### js.fileExtensions

The `js.fileExtensions` option configures which file extensions should be
intercepted by [Babel].

### css

The `css` option configures [Babel] and its process options.

#### css.fileExtensions

The `js.fileExtensions` option configures which file extensions should be
intercepted by [PostCSS].

[cli-img]: https://img.shields.io/travis/jonathantneal/express-variable.svg
[cli-url]: https://travis-ci.org/jonathantneal/express-variable
[git-img]: https://img.shields.io/badge/support-chat-blue.svg
[git-url]: https://gitter.im/postcss/postcss
[npm-img]: https://img.shields.io/npm/v/express-variable.svg
[npm-url]: https://www.npmjs.com/package/express-variable

[Babel]: https://github.com/babel/babel/
[Express]: http://expressjs.com/
[Express Variable]: https://github.com/jonathantneal/express-variable
[PostCSS]: https://github.com/postcss/postcss
