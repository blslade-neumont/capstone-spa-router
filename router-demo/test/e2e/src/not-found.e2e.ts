import { NightwatchBrowser } from "nightwatch";

export function LoadPageNotFound(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/trolls-exist')
        .waitForElementVisible('body')
        .assert.title('Not Found: trolls-exist')
        .assert.containsText('h1', 'Page Not Found')
        .end();
}
