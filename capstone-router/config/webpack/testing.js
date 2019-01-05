let { ContextReplacementPlugin, DefinePlugin, optimize } = require('webpack');
var path = require('path');
var webpackMerge = require('webpack-merge');
var commonConfig = require('./common');

const FRONTEND_ROOT = path.resolve(__dirname, '../../');

let $awesomeTypescript = {
    loader: 'awesome-typescript-loader',
    options: {
        silent: true
    }
};

var karmaConfig = {
    output: {
        path: path.join(FRONTEND_ROOT, 'www'),
    },
    
    module: {
        rules: [
            // .ts files for TypeScript
            { test: /\.ts$/, loaders: [$awesomeTypescript] }
        ]
    }
};

module.exports = webpackMerge(commonConfig, karmaConfig);
