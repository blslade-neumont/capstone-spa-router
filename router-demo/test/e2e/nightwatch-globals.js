let path = require('path');
let { spawn } = require('cross-spawn');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

let server;
function createServer() {
    server = spawn('yarn', ['serve'], { cwd: PROJECT_ROOT });
    return new Promise((resolve, reject) => {
        let resolved = false;
        server.stdout.on('data', data => {
            if (resolved) return;
            data = data.toString();
            if (data.match(/hit ctrl-c to stop the server/i)) {
                resolved = true;
                resolve();
                return;
            }
        });
        server.on('error', e => {
            console.error(e);
            if (!resolved) {
                resolved = true;
                reject();
                return;
            }
        });
        server.on('close', () => {
            if (resolved) return;
            resolved = true;
            reject('Server exited without starting.');
        });
    });
}
function killServer() {
    if (!server) return;
    server.stdout.pause();
    server.kill('SIGINT');
}

module.exports = {
    before: function(done) {
        createServer()
            .then(done)
            .catch(done);
    },
    after: function() {
        killServer();
    },
    reporter: function(results) {
        let noneFailed = (typeof(results.failed) === 'undefined' || results.failed === 0);
        let noneError = (typeof(results.error) === 'undefined' || results.error === 0);
        process.exit(noneFailed && noneError ? 0 : 1);
    },
    waitForConditionTimeout: 2000
};
