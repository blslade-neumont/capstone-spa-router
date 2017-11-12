let merge = require('lodash.merge');

module.exports = function(config) {
    let newConfig = merge({}, require('./common'), {
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,
        
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        
        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO
    });
    
    config.set(newConfig);
};
