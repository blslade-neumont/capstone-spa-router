import { NightwatchBrowser } from "nightwatch";

export function LoadHomepage(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Home')
        .assert.containsText('h1', 'Router Demo Homepage')
        .end();
}
