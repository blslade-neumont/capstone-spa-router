const PKG = require('../../package.json');
const BINPATH = './node_modules/nightwatch/bin/'; // change if required.
const SCREENSHOT_PATH = "./test/e2e/screenshots/" + PKG.version + "/";

const config = {
    "src_folders": [
        "test/e2e/src"
    ],
    "output_folder": "./test/e2e/reports",
    "selenium": {
        "start_process": true,
        "server_path": BINPATH + "selenium.jar", // downloaded by selenium-download module (see below)
        "log_path": "",
        "host": "127.0.0.1",
        "port": 4444,
        "cli_args": {
            "webdriver.chrome.driver": BINPATH + "chromedriver" // also downloaded by selenium-download
        }
    },
    
    "test_settings": {
        "default": {
            "screenshots": {
                "enabled": true,
                "path": SCREENSHOT_PATH
            },
            "globals": {
                "waitForConditionTimeout": 2000
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
    }
};

module.exports = config;

/**
 * selenium-download does exactly what it's name suggests;
 * downloads (or updates) the version of Selenium (& chromedriver)
 * on your localhost where it will be used by Nightwatch.
 */
require('fs').stat(BINPATH + 'selenium.jar', function (err, stat) {
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

var FILECOUNT = 0;
/**
 * The default is to save screenshots to the root of your project even though
 * there is a screenshots path in the config object above! ... so we need a
 * function that returns the correct path for storing our screenshots.
 * While we're at it, we are adding some meta-data to the filename, specifically
 * the Platform/Browser where the test was run and the test (file) name.
 */
function imgpath(browser) {
    var a = browser.options.desiredCapabilities;
    var meta = [a.platform];
    meta.push(a.browserName ? a.browserName : 'any');
    meta.push(a.version ? a.version : 'any');
    meta.push(a.name); // this is the test filename so always exists.
    var metadata = meta.join('~').toLowerCase().replace(/ /g, '');
    return SCREENSHOT_PATH + metadata + '_' + padLeft(FILECOUNT++) + '_';
}

module.exports.imgpath = imgpath;
module.exports.SCREENSHOT_PATH = SCREENSHOT_PATH;
