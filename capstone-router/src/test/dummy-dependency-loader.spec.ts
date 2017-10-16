/// <reference types="jasmine" />

import { DummyDependencyLoader } from '../dummy-dependency-loader';
import { sharedDependencyLoaderTests } from './shared-dependency-loader-tests';

describe('DummyDependencyLoader', () => {
    sharedDependencyLoaderTests(() => {
        let inst = new DummyDependencyLoader();
        return inst;
    });
    
    describe('unique functionality', () => {
        let inst: DummyDependencyLoader;
        beforeEach(() => {
            inst = new DummyDependencyLoader();
        });
        
        describe('.loadSchema', () => {
            it('should throw because it is not supported', async () => {
                try {
                    await inst.loadSchema('some_path.json');
                }
                catch (e) {
                    expect(e.message).toMatch(/not supported/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
        });
        
        describe('.provide', () => {
            it('should prevent values for names not in the schema from being provided', () => {
                expect(() => inst.provide('name', 'value')).toThrowError(/not defined in the schema/i);
            });
            it('should prevent multiple values for the same name from beind provided', () => {
                inst.addSchema([{ type: 'text', name: 'name', src: 'source.txt' }]);
                inst.provide('name', 'value1');
                expect(() => inst.provide('name', 'value2')).toThrowError(/already provided/i);
            });
            it('should not throw if the arguments are valid', () => {
                inst.addSchema([{ type: 'text', name: 'name', src: 'source.txt' }]);
                expect(() => inst.provide('name', 'value')).not.toThrowError();
            });
        });
        
        describe('.get', () => {
            it('should delay by the correct number of milliseconds', async () => {
                inst.addSchema([{ type: 'text', name: 'name', src: 'source.txt' }]);
                inst.provide('name', 'value1');
                (<any>inst).delay = 100;
                let beginMillis = new Date().valueOf();
                await inst.get('name');
                let endMillis = new Date().valueOf();
                expect(endMillis - beginMillis).toBeNear(100, 20);
            });
            it('should not delay if no delay time is specified', async () => {
                inst.addSchema([{ type: 'text', name: 'name', src: 'source.txt' }]);
                inst.provide('name', 'value1');
                let beginMillis = new Date().valueOf();
                await inst.get('name');
                let endMillis = new Date().valueOf();
                expect(endMillis - beginMillis).toBeNear(0, 10);
            });
            it('should throw an error if no value has been provided for this name', async () => {
                try {
                    await inst.get('name');
                }
                catch (e) {
                    expect(e.message).toMatch(/no value for .*name.* provided/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should return the value determined by the previous call to provide', async () => {
                let expected = 'value1';
                inst.addSchema([{ type: 'text', name: 'name', src: 'source.txt' }]);
                inst.provide('name', expected);
                let result = await inst.get('name');
                expect(result).toBe(expected);
            });
        });
    });
});
