import { NightwatchBrowser } from "nightwatch";

export function LoadAbout(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/about')
        .waitForElementVisible('body')
        .assert.title('Router Demo - About')
        .assert.containsText('h1', 'About')
        .end();
}
