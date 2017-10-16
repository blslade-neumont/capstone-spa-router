let { ContextReplacementPlugin, DefinePlugin } = require('webpack');
let path = require('path');
let webpackMerge = require('webpack-merge');
let commonConfig = require('./common');
let clientConfig = require('./client-config');

const ROOT = path.resolve(__dirname, '../../');

//Loaders
let $awesomeTypescript = {
    loader: 'awesome-typescript-loader'
};

let devConfig = {
    
    entry: {
        // 'head':   './src/head.browser.ts',
        // 'main':   './src/main.browser.ts',
        // 'import': './src/styles/gitsupport.scss'
    },
    
    output: {
        path: path.resolve(ROOT, 'www')
    },
    
    plugins: [
        // new webpack.optimize.OccurenceOrderPlugin(true),
        // new webpack.optimize.CommonsChunkPlugin({ name: ['main', 'vendor', 'polyfills', 'head'], minChunks: Infinity }),
        // new webpack.DefinePlugin(clientConfig)
        new ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, path.resolve(ROOT, 'src')),
        new DefinePlugin(clientConfig)
    ],
    
    module: {
        loaders: [
            // .ts files for TypeScript
            { test: /\.ts$/, loaders: [$awesomeTypescript], exclude: /\.spec\.ts$/ }
        ]
    },
    
    devServer: {
        historyApiFallback: true,
        watchOptions: { aggregateTimeout: 300, poll: 1000 },
        disableHostCheck: true,
    },
    
    stats: 'verbose'
};

module.exports = webpackMerge(commonConfig, devConfig);
