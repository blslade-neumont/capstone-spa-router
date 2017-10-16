let { ContextReplacementPlugin, DefinePlugin, optimize } = require('webpack');
let path = require('path');
let webpackMerge = require('webpack-merge');
let commonConfig = require('./common');
let clientConfig = require('./client-config');

const ROOT = path.resolve(__dirname, '../../');

//Loaders
let $awesomeTypescript = {
    loader: 'awesome-typescript-loader',
    options: {
        configFileName: './tsconfig.production.json'
    }
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
        new ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, path.resolve(__dirname, '../src')),
        new DefinePlugin(clientConfig),
        new optimize.UglifyJsPlugin({ warnings: false })
    ],
    
    module: {
        loaders: [
            // .ts files for TypeScript
            { test: /\.ts$/, loaders: [$awesomeTypescript], exclude: /\.spec\.ts$/ }
        ]
    }
    
};

module.exports = webpackMerge(commonConfig, devConfig);
