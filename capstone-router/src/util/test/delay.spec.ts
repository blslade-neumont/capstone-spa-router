/// <reference types="jasmine" />
/// <reference types="jasmine-matchers" />

import { delay } from '../delay';

describe('util/delay', () => {
    it('should throw an error if the argument is not a number', () => {
        expect(() => (<any>delay)()).toThrowError(/not a number/i);
        expect(() => (<any>delay)(null)).toThrowError(/not a number/i);
        expect(() => (<any>delay)('string')).toThrowError(/not a number/i);
        expect(() => (<any>delay)({ key: 'value' })).toThrowError(/not a number/i);
    });
    it('should return a promise', async () => {
        expect(delay(100) instanceof Promise).toBeTruthy();
    });
    describe('that promise', () => {
        it('should resolve after the specified number of milliseconds', async () => {
            let beginMillis = new Date().valueOf();
            await delay(100);
            let endMillis = new Date().valueOf();
            expect(endMillis - beginMillis).toBeNear(100, 20);
        });
    });
});
