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
let $style = {
    loader: 'style-loader'
};
let $css = {
    loader: 'css-loader'
};
let $postcss = {
    loader: 'postcss-loader',
    options: {
        plugins: () => [
            require('precss'),
            require('autoprefixer')
        ]
    }
};
let $sass = {
    loader: 'sass-loader',
    options: {
        includePaths: [
            path.resolve(ROOT, 'src/styles')
        ]
    }
};

let devConfig = {
    entry: {
        'styles': './src/styles/styles.scss',
        'capstone-loader': './src/scripts/visualizer.ts',
        'lazy1': './src/scripts/lazy1.ts',
        'lazy2': './src/scripts/lazy2.ts',
        'lazy3': './src/scripts/lazy3.ts'
    },

    output: {
        path: path.resolve(ROOT, 'dist/scripts')
    },

    plugins: [
        new DefinePlugin(clientConfig)
    ],

    module: {
        rules: [
            { test: /\.ts$/, loaders: [$awesomeTypescript], exclude: /\.spec\.ts$/ },
            { test: /\.scss$/, loaders: [$style, $css, $postcss, $sass] }
        ]
    },

    devServer: {
        historyApiFallback: true,
        watchOptions: { aggregateTimeout: 300, poll: 1000 }
    }
};

module.exports = webpackMerge(commonConfig, devConfig);
