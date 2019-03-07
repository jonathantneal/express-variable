import babel from '@babel/core';
import cosmiconfig from 'cosmiconfig';
import fs from 'fse';
import path from 'path';
import pHTML from 'phtml';
import postcss from 'postcss';

export default function expressVariable(dir, rawopts) {
	const postcssConfig = cosmiconfig('postcss').search();
	const phtmlConfig = cosmiconfig('phtml').search();

	return async (request, response, next) => {
		// transform GET requests, ignore the rest
		const isValidRequestMethod = /^GET$/i.test(request.method);

		if (!isValidRequestMethod) {
			return next();
		}

		// configure the JS and CSS options
		const cssOpts = Object(Object(rawopts).css);
		const htmlOpts = Object(Object(rawopts).html);
		const jsOpts = Object(Object(rawopts).js);
		const index = 'index' in Object(rawopts)
			? rawopts.index
				? String(rawopts.index)
			: false
		: 'index.html';

		const cssConfigOpts = Object(Object(await postcssConfig).config);
		const htmlConfigOpts = Object(Object(await phtmlConfig).config);

		const opts = {
			css: {
				...cssConfigOpts,
				...cssOpts,
				fileExtensions: [].concat(cssOpts.fileExtensions || ['css', 'pcss']),
			},
			html: {
				...htmlConfigOpts,
				...htmlOpts,
				fileExtensions: [].concat(htmlOpts.fileExtensions || ['html', 'phtml'])
			},
			js: {
				...jsOpts,
				fileExtensions: [].concat(jsOpts.fileExtensions || ['js', 'mjs'])
			}
		};

		// determine path information about the request
		let fullpath = path.resolve(`${dir || ''}${request.path}`);
		const extension = path.extname(fullpath).slice(1);

		// determine whether a JS or CSS request is being made, ignore the rest
		const isCssExtension = opts.css.fileExtensions.includes(extension);
		const isJsExtension = opts.js.fileExtensions.includes(extension);
		let isHtmlExtension = opts.html.fileExtensions.includes(extension);

		if (!isJsExtension && !isCssExtension && !isHtmlExtension) {
			try {
				const indexpath = path.resolve(fullpath, index);

				await fs.stat(indexpath);

				fullpath = indexpath;
				isHtmlExtension = true;
			} catch (error) {
				return next();
			}
		}

		try {
			// determine if the file exists and has been modified since the last request
			const stat = await fs.stat(fullpath);
			const lastModifiedUTCString = new Date(stat.mtimeMs).toUTCString();
			const isTheFileUnmodified = request.headers['if-modified-since'] === lastModifiedUTCString;

			let buffer;

			if (isTheFileUnmodified) {
				// return a 304 response header if the file has not been modified since the last request
				response.writeHead(304);

				return response.end();
			} else {
				// read the source as UTF-8 content
				const source = await fs.readFile(fullpath, 'utf8');

				if (isCssExtension) {
					// configure postcss process options
					const processOpts = { ...opts.css, from: fullpath };

					delete processOpts.fileExtensions;
					delete processOpts.plugins;

					const plugins = Array.from(opts.css.plugins || []);

					// process the source using postcss
					const result = await postcss(plugins).process(source, processOpts);

					buffer = result.css;
				} else if (isHtmlExtension) {
					// configure phtml process options
					const processOpts = { ...opts.html, from: fullpath };

					delete processOpts.fileExtensions;
					delete processOpts.index;
					delete processOpts.plugins;

					const plugins = Array.from(opts.html.plugins || []);

					// process the source using phtml
					const result = await pHTML.use(plugins).process(source, processOpts);

					buffer = result.html;
				} else if (isJsExtension) {
					// configure babel transform options
					const transformOpts = { ...opts.js, filename: fullpath };

					delete transformOpts.fileExtensions;

					// process the source using babel
					const result = await babel.transformAsync(source, transformOpts);

					buffer = result.code;
				}
			}

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
