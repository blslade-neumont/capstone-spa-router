var path = require('path');

const ROOT = path.resolve(__dirname, '../../');

// Our Webpack Defaults
var defaultConfig = {
    devtool: 'cheap-module-source-map',
    cache: true,
    mode: 'development',
    
    output: {
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].chunk.js'
    },
    
    resolve: {
        alias: {
            '@aboveyou00/capstone-router$': path.join(ROOT, 'src/index')
        },
        modules: [
            path.join(ROOT, 'node_modules'),
            path.join(ROOT, 'src')
        ],
        extensions: ['.ts', '.js']
    },
    
    node: {
        global: true,
        crypto: 'empty',
        __dirname: true,
        __filename: true,
        process: true,
        module: false,
        Buffer: false,
        clearImmediate: false,
        setImmediate: false
    }
};
module.exports = defaultConfig;
