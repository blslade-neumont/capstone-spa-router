const PKG = require('../../package.json');
let path = require('path');
const BINPATH = path.resolve(__dirname, 'bin');
const SCREENSHOT_PATH = path.resolve(__dirname, "screenshots", PKG.version);
const GLOBALS_PATH = path.resolve(__dirname, 'nightwatch-globals.js');

const config = {
    "src_folders": [
        "test/e2e/src"
    ],
    "output_folder": "./test/e2e/reports",
    "selenium": {
        "start_process": true,
        "server_path": path.resolve(BINPATH, "selenium.jar"),
        "log_path": "",
        "host": "127.0.0.1",
        "port": 4444,
        "cli_args": {
            "webdriver.chrome.driver": path.resolve(BINPATH, "chromedriver")
        }
    },
    
    "test_settings": {
        "default": {
            "screenshots": {
                "enabled": true,
                "path": SCREENSHOT_PATH
            },
            "desiredCapabilities": {
                "browserName": "chrome",
                "chromeOptions" : {
                   "args" : ["headless"]
                }
            }
        },
        "chrome": {
            "desiredCapabilities": {
                "browserName": "chrome",
                "javascriptEnabled": true
            }
        }
    },
    
    "globals_path": GLOBALS_PATH
};

module.exports = config;

/**
 * selenium-download does exactly what it's name suggests;
 * downloads (or updates) the version of Selenium (& chromedriver)
 * on your localhost where it will be used by Nightwatch.
 */
require('fs').stat(path.resolve(BINPATH, 'selenium.jar'), function (err, stat) {
    if (err || !stat || stat.size < 1) {
        require('selenium-download').ensure(BINPATH, function(error) {
            if (error) throw new Error(error);
            console.log('✔ Selenium & Chromedriver downloaded to:', BINPATH);
        });
    }
});

function padLeft(count) {
    return count < 10 ? '0' + count : count.toString();
}
