/// <reference types="jasmine" />

import { resolveLocalHref as fn } from '../resolve-local-href';

describe('util/resolveLocalHref', () => {
    it('should return the relative path if the host is the same', () => {
        expect(fn('http://localhost:8080', '/', 'http://localhost:8080/about')).toBe('/about');
        expect(fn('http://www.mysite.com', '/fish/devs', 'http://www.mysite.com/about')).toBe('/about');
        expect(fn('http://www.abc.xyz', '/', '/orange')).toBe('/orange');
        expect(fn('http://www.abc.xyz', '/one/two', 'three')).toBe('/one/three');
        expect(fn('http://www.abc.xyz', '/one/two', 'three/four')).toBe('/one/three/four');
        expect(fn('http://www.abc.xyz', '/', 'one')).toBe('/one');
    });
    it('should return null if the host is not the same', () => {
        expect(fn('http://www.abc.xyz', '/', 'http://www.google.com/')).toBe(null);
        expect(fn('http://localhost:8080', '/', 'email://some@email.com')).toBe(null);
    });
    it('should flatten ./ and ../ at the beginning of the href', () => {
        expect(fn('http://www.abc.xyz', '/one/two/three', '../four')).toBe('/one/four');
        expect(fn('http://www.abc.xyz', '/one/two/three/', '../four')).toBe('/one/two/four');
        expect(fn('http://www.abc.xyz', '/one/two', '../three/four')).toBe('/three/four');
        expect(fn('http://www.abc.xyz', '/one/two/three', '../../four/five')).toBe('/four/five');
        expect(fn('http://www.abc.xyz', '/one/two/three', './four')).toBe('/one/two/four');
    });
});
