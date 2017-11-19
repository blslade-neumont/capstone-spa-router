/// <reference types="jasmine" />

import { createPreloadStrategy } from '../create-preload-strategy';
import { PreloadNothingStrategy } from '../preload-nothing-strategy';
import { FollowLinksPreloadStrategy } from '../follow-links-preload-strategy';
import { PreloadEverythingStrategy } from '../preload-everything-strategy';

describe('util/createPreloadStrategy', () => {
    it('should return a PreloadNothingStrategy if nothing is passed in', () => {
        expect(createPreloadStrategy() instanceof PreloadNothingStrategy).toBe(true);
    });
    it(`should return a PreloadNothingStrategy if 'none' is passed in`, () => {
        expect(createPreloadStrategy('none') instanceof PreloadNothingStrategy).toBe(true);
    });
    it(`should return a FollowLinksPreloadStrategy if 'follow-links' is passed in`, () => {
        expect(createPreloadStrategy('follow-links') instanceof FollowLinksPreloadStrategy).toBe(true);
    });
    it(`should return a PreloadEverythingStrategy if 'all' is passed in`, () => {
        expect(createPreloadStrategy('all') instanceof PreloadEverythingStrategy).toBe(true);
    });
    it(`should return the same instance if an instance of PreloadStrategy is passed in`, () => {
        let inst = new PreloadNothingStrategy();
        expect(createPreloadStrategy(inst)).toBe(inst);
    });
    it(`should throw an error if any other value is passed in`, () => {
        expect(() => createPreloadStrategy(<any>'fish')).toThrowError(/invalid preload strategy/i);
        expect(() => createPreloadStrategy(<any>'')).toThrowError(/invalid preload strategy/i);
        expect(() => createPreloadStrategy(<any>{ key: 'value' })).toThrowError(/invalid preload strategy/i);
    });
});
