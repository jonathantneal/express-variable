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
  },
  html: {
    plugins: [ /* phtml plugins go here */ ]
    /* more phtml process options go here */
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

The first argument determines the directory being watched. The second option configures the transformers; [pHTML], [PostCSS], and [Babel].

### html

The `html` option configures [pHTML] and its process options.

#### html.fileExtensions

The `html.fileExtensions` option configures which file extensions should be
intercepted by [pHTML].

#### html.index

The `html.index` option defines a specified directory index HTML file. Setting
this to false to disables directory indexing.

### css

The `css` option configures [Babel] and its process options.

#### css.fileExtensions

The `js.fileExtensions` option configures which file extensions should be
intercepted by [PostCSS].

### js

The `js` option configures [Babel] and its transform options.

#### js.fileExtensions

The `js.fileExtensions` option configures which file extensions should be
intercepted by [Babel].

### index

The `index` option configures the default HTML file loaded by a directory. By
default, `index.html` is used. It can be disabled with `false` or overridden by
passing in a new string.

### config

The `config` option provides the default configuration for [html](#html),
[css](#css), and [js](#js). If defined as a string, the configuration can be
loaded by files matching that string pattern as transformed by [cosmiconfig].

### onReady

The `onReady` option defines a callback function to be run once all of the
configurations have finished loading. This function receives the mutatable
options used by Express Variable.

```js
{
  onReady(opts) {
    // mutate opts here
  }
}
```

### onHTML

The `onHTML` option defines an asynchronous callback function to be run
whenever HTML is being transformed. This function receives the mutatable
options passed to Express Variable and returns the string response passed to
the browser.

```js
{
  onHTML(opts) {
    // mutate opts here

    // return the default response for HTML
    return opts.defaultOnHTML();
  }
}
```

### onCSS

The `onCSS` option defines an asynchronous callback function to be run whenever
CSS is being transformed. This function receives the mutatable options used by
Express Variable and returns the string response passed to the browser.

```js
{
  onCSS(opts) {
    // mutate opts here

    // return the default response for CSS
    return opts.defaultOnCSS();
  }
}
```

### onJS

The `onJS` option defines an asynchronous callback function to be run whenever
JS is being transformed. This function receives the mutatable options used by
Express Variable and returns the string response passed to the browser.

```js
{
  onJS(opts) {
    // mutate opts here

    // return the default response for JS
    return opts.defaultOnJS();
  }
}
```

[cli-img]: https://img.shields.io/travis/jonathantneal/express-variable.svg
[cli-url]: https://travis-ci.org/jonathantneal/express-variable
[git-img]: https://img.shields.io/badge/support-chat-blue.svg
[git-url]: https://gitter.im/postcss/postcss
[npm-img]: https://img.shields.io/npm/v/express-variable.svg
[npm-url]: https://www.npmjs.com/package/express-variable

[cosmiconfig]: https://github.com/davidtheclark/cosmiconfig
[Babel]: https://github.com/babel/babel/
[Express]: http://expressjs.com/
[Express Variable]: https://github.com/jonathantneal/express-variable
[pHTML]: https://github.com/phtmlorg/phtml
[PostCSS]: https://github.com/postcss/postcss
