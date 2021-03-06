'use strict';

let path = require('path');
let argv = require('yargs').argv;
let minimatch = require("minimatch");

let webpackConfig = require('../webpack/testing');

let rootProjectPath = path.join(__dirname, '../../');

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = {
    
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: rootProjectPath,
    
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
        'jasmine',
        'jasmine-matchers'
    ],
    
    plugins: [
        require('karma-webpack'),
        require('karma-jasmine'),
        require('karma-jasmine-matchers'),
        require('karma-super-dots-reporter'),
        require('karma-defer-spec-reporter'),
        require('karma-chrome-launcher'),
        require('karma-firefox-launcher')
    ],
    
    mime: {
        'text/x-typescript': ['ts','tsx']
    },
    
    // list of files / patterns to load in the browser
    files: [
        // Polyfills
        './node_modules/promise-polyfill/promise.js',
        './node_modules/map-polyfill/dist/map.min.js',
        './node_modules/string.prototype.startswith/startswith.js',
        
        // Spec tests.
        './src/**/*.spec.ts'
    ],
    
    webpack: webpackConfig,
    webpackMiddleware: {
        stats: 'errors-only',
        quiet: true
    },
    
    preprocessors: {
        './src/**/*.spec.ts': ['webpack']
    },
    
    // // must go along with above, suppress annoying 404 warnings.
    // proxies: {
    //     '/assets/': '/base/dist/dev/assets/'
    // },
    
    // // list of files to exclude
    // exclude: [
    //     'node_modules/**/*spec.js'
    // ],
    
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    
    reporters: ['super-dots', 'defer-spec'],
    superDotsReporter: {
        icon: {
            success: '.',
            failure: 'X',
            ignore: '#'
        },
        color: {
            success: 'green',
            failure: 'red',
            ignore: 'yellow'
        }
    },
    
    // web server port
    port: 9876,
    
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    
    // Passing command line arguments to tests
    client: {
        files:  argv.files ? minimatch.makeRe(argv.files).source : null
    },
    
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless', 'FirefoxHeadless'],
    
    customLaunchers: {
        FirefoxHeadless: {
            base: 'Firefox',
            flags: [ '-headless' ],
        },
    }
};

// if (process.env.APPVEYOR) {
//     config.browsers = ['IE'];
//     config.singleRun = true;
//     config.browserNoActivityTimeout = 90000; // Note: default value (10000) is not enough
// }

// if (process.env.TRAVIS || process.env.CIRCLECI) {
//     config.browsers = ['Chrome_travis_ci'];
//     config.singleRun = true;
//     config.browserNoActivityTimeout = 90000;
// }
