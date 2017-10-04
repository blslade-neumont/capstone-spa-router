let { ContextReplacementPlugin, DefinePlugin } = require('webpack');
let path = require('path');
let webpackMerge = require('webpack-merge');
let commonConfig = require('./common');
let clientConfig = require('./client-config');

//Loaders
let $awesomeTypescript = {
    loader: 'awesome-typescript-loader'
};

let $raw = {
    loader: 'raw-loader'
};

let devConfig = {
    entry: {
        'lazy1': './src/scripts/lazy1.ts',
        'lazy2': './src/scripts/lazy2.ts',
        'lazy3': './src/scripts/lazy3.ts'
    },

    output: {
        path: path.resolve(__dirname, '../../dist/scripts')
    },

    plugins: [
        new DefinePlugin(clientConfig)
    ],

    module: {
        loaders: [
            { test: /\.ts$/, loaders: [$awesomeTypescript], exclude: /\.spec\.ts$/ },
            { test: /\.glslx$/, loaders: [$raw] }
        ]
    },

    devServer: {
        historyApiFallback: true,
        watchOptions: { aggregateTimeout: 300, poll: 1000 }
    }
};

module.exports = webpackMerge(commonConfig, devConfig);
