import babel from '@babel/core';
import cosmiconfig from 'cosmiconfig';
import fs from 'fse';
import path from 'path';
import pHTML from 'phtml';
import postcss from 'postcss';

export default function expressVariable(dir, rawopts) {
	const optsPromise = Promise.all([
		typeof Object(rawopts).config === 'string' ? cosmiconfig(rawopts.config).search() : Promise.resolve(Object(rawopts).config),
		cosmiconfig('babel').search(),
		cosmiconfig('postcss').search(),
		cosmiconfig('phtml').search()
	]).then(results => results.map(result => Object(Object(result).config))).then(([universalConfig, babelConfig, postcssConfig, phtmlConfig]) => {
		// configure the JS and CSS options
		const cssOpts = Object(rawopts).css;
		const htmlOpts = Object(rawopts).html;
		const jsOpts = Object(rawopts).js;

		// normalize the index option
		const index = 'index' in Object(rawopts)
			? rawopts.index
				? String(rawopts.index)
			: false
		: 'index.html';

		// normalize the css option
		const css = {
			...Object(universalConfig.css),
			...Object(postcssConfig),
			...Object(cssOpts),
			fileExtensions: [].concat(Object(cssOpts).fileExtensions || ['css', 'pcss']),
		};

		css.plugins = [].concat(css.plugins || []);

		// normalize the html option
		const html = {
			...Object(universalConfig.html),
			...Object(phtmlConfig),
			...Object(htmlOpts),
			fileExtensions: [].concat(Object(htmlOpts).fileExtensions || ['html', 'phtml'])
		};

		html.plugins = [].concat(html.plugins || []);

		// normalize the js option
		const js = {
			...Object(universalConfig.js),
			...Object(babelConfig),
			...Object(jsOpts),
			fileExtensions: [].concat(Object(jsOpts).fileExtensions || ['js', 'mjs'])
		};

		js.plugins = [].concat(js.plugins || []);

		const opts = { index, css, html, js };

		opts.onReady = Object(rawopts).onReady;
		opts.onHTML = Object(rawopts).onHTML;
		opts.onCSS = Object(rawopts).onCSS;
		opts.onJS = Object(rawopts).onJS;

		// fire the onReady function
		if (typeof opts.onReady === 'function') {
			rawopts.onReady(opts);
		}

		return opts;
	});

	return async (request, response, next) => {
		// transform GET requests, ignore the rest
		const isValidRequestMethod = /^GET$/i.test(request.method);

		if (!isValidRequestMethod) {
			return next();
		}

		// determine path information about the request
		let fullpath = path.resolve(`${dir || ''}${request.path}`);
		const extension = path.extname(fullpath).slice(1);

		const opts = await optsPromise;

		// determine whether an HTML, CSS, or JS request is being made, ignore the rest
		const isCssExtension = opts.css.fileExtensions.includes(extension);
		const isJsExtension = opts.js.fileExtensions.includes(extension);
		let isHtmlExtension = opts.html.fileExtensions.includes(extension);

		// further determine whether an index HTML request is being made
		if (!isJsExtension && !isCssExtension && !isHtmlExtension && opts.index) {
			try {
				const indexpath = path.resolve(fullpath, opts.index);

				fs.statSync(indexpath);

				fullpath = indexpath;
				isHtmlExtension = true;
			} catch (error) {
				return next();
			}
		}

		try {
			// determine if the file exists and has been modified since the last request
			const stat = fs.statSync(fullpath);
			const lastModifiedUTCString = new Date(stat.mtimeMs).toUTCString();
			const isTheFileUnmodified = request.headers['if-modified-since'] === lastModifiedUTCString;

			let buffer;

			if (isTheFileUnmodified) {
				// return a 304 response header if the file has not been modified since the last request
				response.writeHead(304);

				return response.end();
			}

			// read the source as UTF-8 content
			opts.fullpath = fullpath;
			opts.source = fs.readFileSync(fullpath, 'utf8');

			opts.defaultOnCSS = () => {
				// configure postcss process options
				const processOpts = { ...opts.css, from: fullpath };

				delete processOpts.fileExtensions;
				delete processOpts.plugins;

				// process the source using postcss
				return postcss(opts.css.plugins).process(opts.source, processOpts).then(
					result => result.css
				);
			};

			opts.defaultOnHTML = () => {
				// configure phtml process options
				const processOpts = { ...opts.html, from: fullpath };

				delete processOpts.fileExtensions;
				delete processOpts.plugins;

				// process the source using phtml
				return pHTML.use(opts.html.plugins).process(opts.source, processOpts).then(
					result => result.html
				);
			};

			opts.defaultOnJS = () => {
				// configure babel transform options
				const transformOpts = { ...opts.js, babelrc: false, filename: fullpath };

				delete transformOpts.fileExtensions;

				// process the source using babel
				return babel.transformAsync(opts.source, transformOpts).then(
					result => result.code
				);
			};

			buffer = await (
				isCssExtension
					? typeof opts.onCSS === 'function'
						? opts.onCSS(opts)
					: opts.defaultOnCSS()
				: isHtmlExtension
					? typeof opts.onHTML === 'function'
						? opts.onHTML(opts)
					: opts.defaultOnHTML()
				: isJsExtension
					? typeof opts.onJS === 'function'
						? opts.onJS(opts)
					: opts.defaultOnJS()
				: Promise.resolve('')
			);

			// determine the content type being served
			const contentType = `${isHtmlExtension ? 'text/html' : isJsExtension ? 'application/javascript' : 'text/css'}; charset=UTF-8`;

			// serve the appropriate response headers for the request
			response.setHeader('Content-Length', buffer.length);
			response.setHeader('Content-Type', contentType);
			response.setHeader('Last-Modified', lastModifiedUTCString);

			// serve the appropriate response for the request
			response.write(buffer);

			// end the response
			return response.end();
		} catch (error) {
			// return the forwarded error
			return next(error);
		}
	}
}
