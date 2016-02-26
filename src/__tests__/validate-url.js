import test from 'ava';
import path from 'path';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';
import makeRegex from './helpers/make-regex';

test('should correctly parse url', t => {
    return processStyle('src/correct-parse-url.css', {
        src: 'src',
        dest: randomFolder('dest', t.title),
        template: '[path]/[name].[ext]'
    })
    .then(result => {
        const css = result.css;
        t.regex(css, makeRegex('fonts/MaterialIcons-Regular.woff'));
        t.regex(css, makeRegex('fonts/MaterialIcons-Regular.woff2'));
    });
});

test('should ignore if the url() is not valid', t => {
    return processStyle('src/invalid.css', {
        src: 'src',
        dest: randomFolder('dest', t.title)
    })
    .then(result => {
        const css = result.css;
        t.is(result.warnings().length, 0);
        t.regex(css, makeRegex('b6c8f21e92b50900.jpg'));
        t.regex(css, makeRegex('data:image/gif;base64,R0lGOD'));
    });
});

test('should ignore if the asset is not found in the src path', t => {
    return processStyle('src/not-found.css', {
        src: 'src',
        dest: randomFolder('dest', t.title)
    })
    .then(result => {
        const css = result.css;
        const warnings = result.warnings();
        t.is(warnings.length, 1);
        t.is(warnings[0].text, `Can't read the file in ${
            path.resolve('src/images/image-not-found.jpg')
        }`);
        t.regex(css, makeRegex('b6c8f21e92b50900.jpg'));
        t.regex(css, makeRegex('images/image-not-found.jpg'));
    });
});
