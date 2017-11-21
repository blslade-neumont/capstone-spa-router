import { NightwatchBrowser } from "nightwatch";

export function LoadPage1(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/pages/1')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Page 1')
        .assert.containsText('h1', 'Page 1')
        .end();
}

export function LoadPage2(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/pages/2')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Page 2')
        .assert.containsText('h1', 'Page 2')
        .end();
}

export function LoadPage3(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/pages/3')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Page 3')
        .assert.containsText('h1', 'Page 3')
        .end();
}

export function NavigateBetweenPages(browser: NightwatchBrowser) {
    browser
        .url('http://localhost:8084/pages/1')
        .waitForElementVisible('body')
        .assert.title('Router Demo - Page 1')
        .assert.containsText('h1', 'Page 1')
        
        .click('div.col-md-9 .ml-auto a.nav-link')
        .pause(200)
        .assert.title('Router Demo - Page 2')
        .assert.containsText('h1', 'Page 2')
        
        .click('div.col-md-9 .ml-auto a.nav-link')
        .pause(200)
        .assert.title('Router Demo - Page 3')
        .assert.containsText('h1', 'Page 3')
        
        .click('div.col-md-9 :not(.ml-auto) a.nav-link')
        .pause(200)
        .assert.title('Router Demo - Page 2')
        .assert.containsText('h1', 'Page 2')
        
        .click('div.col-md-9 :not(.ml-auto) a.nav-link')
        .pause(200)
        .assert.title('Router Demo - Page 1')
        .assert.containsText('h1', 'Page 1')
        
        .end();
}
