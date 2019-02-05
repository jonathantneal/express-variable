import babel from '@babel/core';
import fs from 'fse';
import path from 'path';
import postcss from 'postcss';

export default function expressVariable(dir, rawopts) {
	return async (request, response, next) => {
		// transform GET requests, ignore the rest
		const isValidRequestMethod = /^GET$/i.test(request.method);

		if (!isValidRequestMethod) {
			return next();
		}

		// configure the JS and CSS options
		const jsOpts = Object(Object(rawopts).js);
		const cssOpts = Object(Object(rawopts).css);

		const opts = {
			js: {
				...jsOpts,
				fileExtensions: [].concat(jsOpts.fileExtensions || ['js', 'mjs'])
			},
			css: {
				...cssOpts,
				fileExtensions: [].concat(cssOpts.fileExtensions || ['css', 'pcss'])
			}
		};

		// determine path information about the request
		const fullpath = path.resolve(`${dir || ''}${request.path}`);
		const extension = path.extname(fullpath).slice(1);

		// determine whether a JS or CSS request is being made, ignore the rest
		const isJsExtension = opts.js.fileExtensions.includes(extension);
		const isCssExtension = opts.css.fileExtensions.includes(extension);

		if (!isJsExtension && !isCssExtension) {
			return next();
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

				if (isJsExtension) {
					// configure babel transform options
					const transformOpts = { ...opts.js, filename: fullpath };

					delete transformOpts.fileExtensions;

					// process the source using babel
					const result = await babel.transformAsync(source, transformOpts);

					buffer = result.code;
				} else if (isCssExtension) {
					// configure postcs transform options
					const processOpts = { ...opts.css, from: fullpath };

					delete processOpts.fileExtensions;
					delete processOpts.plugins;

					// process the source using postcss
					const result = await postcss(opts.css.plugins).process(source, processOpts);

					buffer = result.css;
				}
			}

			// determine the content type being served
			const contentType = `${isJsExtension ? 'application/javascript' : 'text/css'}; charset=UTF-8`;

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
