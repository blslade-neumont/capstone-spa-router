import { NightwatchBrowser } from "nightwatch";

export function LoadHomepage(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Home')
        .assert.containsText('h1', 'Router Demo Homepage')
        .end();
}

export function NavigateBack(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Home')
        .assert.containsText('h1', 'Router Demo Homepage')
        
        .click('.nav-link[href*=about]')
        .pause(200)
        .assert.title('Router Demo - About')
        .assert.containsText('h1', 'About This Site')
        
        .back()
        .pause(50)
        .assert.title('Router Demo - Home')
        .assert.containsText('h1', 'Router Demo Homepage')
        
        .end();
}
