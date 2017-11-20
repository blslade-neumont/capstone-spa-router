import { NightwatchBrowser } from "nightwatch";

export function LoadHomepage(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Home')
        // .saveScreenshot('home.png')
        .end();
}
