import test from 'ava';
import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import processStyle from './helpers/process-style.js';
import makeRegex from './helpers/make-regex.js';
import commonTests from './common-tests.json';

function testFileExists(t, file) {
    return pathExists(path.join('dest', file))
        .then(exists => {
            t.ok(exists, `File "${file}" created.`);
        });
}

commonTests.forEach(item => {
    if (item.opts.hashFunction === 'custom') {
        item.opts.hashFunction = contents => {
            // borschik
            return crypto.createHash('sha1')
                .update(contents)
                .digest('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/\=/g, '')
                .replace(/^[+-]+/g, '');
        };
    }

    if (item.opts.inputPath) {
        item.opts.inputPath = decl => {
            return path.dirname(decl.source.input.file);
        };
    }

    if (item.opts.relativePath === false) {
        item.opts.relativePath = (dirname, fileMeta, result, options) => {
            return result.opts.to || options.dest;
        };
    }

    test(item.name, t => {
        const copyOpts = Object.assign({
            src: 'src',
            dest: 'dest'
        }, item.opts);

        let oldTime;
        let newTime;

        return processStyle('src/index.css', copyOpts)
            .then(result => {
                const css = result.css;
                item.assertions.index.forEach(assertion => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                oldTime = fs.statSync(
                    path.join('dest', item.assertions['no-modified'])
                ).mtime.getTime();

                copyOpts.src = ['src', 'external_libs'];
                return processStyle(
                    'src/component/index.css',
                    copyOpts
                );
            })
            .then(result => {
                const css = result.css;
                item.assertions.component.forEach(assertion => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                newTime = fs.statSync(
                    path.join('dest', item.assertions['no-modified'])
                ).mtime.getTime();

                t.is(
                    oldTime,
                    newTime,
                    `${item.assertions['no-modified']} was not modified.`
                );

                return processStyle(
                    'external_libs/bootstrap/css/bootstrap.css',
                    copyOpts
                );
            })
            .then(result => {
                const css = result.css;
                item.assertions.external_libs.forEach(assertion => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                newTime = fs.statSync(
                    path.join('dest', item.assertions['no-modified'])
                ).mtime.getTime();

                t.is(
                    oldTime,
                    newTime,
                    `${item.assertions['no-modified']} was not modified.`
                );

                return Promise.all(item.assertions.exists.map(file => {
                    return testFileExists(t, file);
                }));
            });
    });
});
