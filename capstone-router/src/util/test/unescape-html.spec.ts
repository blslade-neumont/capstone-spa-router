/// <reference types="jasmine" />
/// <reference types="jasmine-matchers" />

import { unescapeHtml } from '../unescape-html';

describe('util/unescapeHtml', () => {
    it('should not run any scripts', () => {
        (<any>window).xss = function() {};
        spyOn((<any>window), 'xss');
        let result = unescapeHtml("<img src='dummy' onerror='xss()'>");
        expect(result).toBe('');
        expect((<any>window).xss).not.toHaveBeenCalled();
        delete (<any>window).xss;
    });
    it('should pass regular text through unchanged', async () => {
        let expected = "Hello, World!";
        expect(unescapeHtml(expected)).toBe(expected);
    });
    it('should unescape html character entities', async () => {
        let original = "R&eacute;sum&eacute;";
        let expected = "Résumé";
        expect(unescapeHtml(original)).toBe(expected);
    });
    it('should pass the original text back unchanged if html parsing is not supported by the DomParser', async () => {
        let spy = spyOn(DOMParser.prototype, 'parseFromString').and.returnValue(null);
        let expected = "R&eacute;sum&eacute;";
        expect(unescapeHtml(expected)).toBe(expected);
    });
});
