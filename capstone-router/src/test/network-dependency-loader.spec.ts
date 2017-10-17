/// <reference types="jasmine" />

import { NetworkDependencyLoader } from '../network-dependency-loader';
import { sharedDependencyLoaderTests } from './shared-dependency-loader-tests';
import { delay } from '../util/delay';
import { SchemaT, SimpleContentMetaT, DynamicContentMetaT } from '../schema';

describe('NetworkDependencyLoader', () => {
    sharedDependencyLoaderTests(() => {
        return new NetworkDependencyLoader();
    });
    
    describe('unique functionality', () => {
        let inst: NetworkDependencyLoader;
        beforeEach(() => {
            inst = new NetworkDependencyLoader();
        });
        
        describe('.loadContentResource', () => {
            //TODO: add network integration tests
        });
        
        describe('.executeScriptResource', () => {
            //TODO: add network integration tests
        });
        
        describe('.loadSchema', () => {
            it('should call loadContentResource with the provided path', async () => {
                let schema = JSON.stringify({
                    router: [],
                    content: <SchemaT>[
                        { type: 'text', name: 'name', src: 'source.txt' },
                        { type: 'script', name: 'name2', src: 'source.js', methodName: 'func' },
                    ]
                });
                let path = 'some-path.json';
                (<any>inst).resources.set(path, { loadPromise: Promise.resolve(), isLoaded: true, isContent: true, content: schema });
                spyOn(<any>inst, 'loadContentResource').and.callThrough();
                await inst.loadSchema(path);
                expect((<any>inst).loadContentResource).toHaveBeenCalled();
            });
            it('should throw an error if the schema file is invalid', async () => {
                let schema = 'my invalid json';
                let path = 'some-path.json';
                (<any>inst).resources.set(path, { loadPromise: Promise.resolve(), isLoaded: true, isContent: true, content: schema });
                try {
                    await inst.loadSchema(path);
                }
                catch (e) {
                    expect(e.message).toMatch(/failed to parse schema/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            it('should call addSchema with the parsed schema content', async () => {
                let schemaContent: SchemaT = [
                    { type: 'text', name: 'name', src: 'source.txt' },
                    { type: 'script', name: 'name2', src: 'source.js', methodName: 'func' },
                ];
                let schema = JSON.stringify({
                    router: [],
                    content: schemaContent
                });
                let path = 'some-path.json';
                (<any>inst).resources.set(path, { loadPromise: Promise.resolve(), isLoaded: true, isContent: true, content: schema });
                spyOn(inst, 'addSchema');
                await inst.loadSchema(path);
                expect(inst.addSchema).toHaveBeenCalledWith(schemaContent);
            });
        });
        
        describe('.getContentImpl', () => {
            it('should throw an error if the name is not defined in the schema', async () => {
                try {
                    await (<any>inst).getContentImpl('name');
                }
                catch (e) {
                    expect(e.message).toMatch(/content .* is not defined in the schema/i);
                    return;
                }
                expect(true).toBeFalsy();
            });
            
            let textContent: SimpleContentMetaT = { type: 'text', name: 'text', src: 'text.txt' };
            let scriptContent: DynamicContentMetaT = { type: 'script', name: 'script', src: 'script.js', methodName: 'dl_func' };
            let scriptDepContent: DynamicContentMetaT = { type: 'script', name: 'scriptWithDep', src: 'script.js', methodName: 'dl_func2', deps: ['script'] };
            
            describe(`when the content is 'text'`, () => {
                let expectedContent: 'my-expected-content';
                beforeEach(() => {
                    (<any>inst).schemaMap.set(textContent.name, textContent);
                    (<any>inst).resources.set(textContent.src, { loadPromise: Promise.resolve(), isLoaded: true, isContent: true, content: expectedContent });
                });
                it('should call loadContentResource', async () => {
                    spyOn(<any>inst, 'loadContentResource');
                    await (<any>inst).getContentImpl(textContent.name);
                    expect((<any>inst).loadContentResource).toHaveBeenCalled();
                });
                it('should return the value returned by loadContentResource', async () => {
                    let result = await (<any>inst).getContentImpl(textContent.name);
                    expect(result).toBe(expectedContent);
                });
                it('should return the same value if called twice with the same name', async () => {
                    let result = await (<any>inst).getContentImpl(textContent.name);
                    let result2 = await (<any>inst).getContentImpl(textContent.name);
                    expect(result).toBe(result2);
                });
            });
            
            describe(`when the content is 'script'`, () => {
                beforeEach(() => {
                    (<any>inst).schemaMap.set(scriptContent.name, scriptContent);
                    (<any>inst).schemaMap.set(scriptDepContent.name, scriptDepContent);
                    (<any>inst).resources.set(scriptContent.src, { loadPromise: Promise.resolve(), isLoaded: true, isContent: false });
                });
                it('should call executeScriptResource', async () => {
                    (<any>window).dl_func = function() { };
                    spyOn(<any>inst, 'executeScriptResource');
                    await (<any>inst).getContentImpl(scriptContent.name);
                    expect((<any>inst).executeScriptResource).toHaveBeenCalled();
                    delete (<any>window).dl_func;
                });
                it('should execute the requested function', async () => {
                    (<any>window).dl_func = function() { };
                    spyOn(<any>window, 'dl_func');
                    await (<any>inst).getContentImpl(scriptContent.name);
                    expect((<any>window).dl_func).toHaveBeenCalled();
                    delete (<any>window).dl_func;
                });
                it('should return the value returned by the requested function', async () => {
                    let expected = 42;
                    (<any>window).dl_func = function() { return expected; };
                    let result = await (<any>inst).getContentImpl(scriptContent.name);
                    expect(result).toBe(expected);
                    delete (<any>window).dl_func;
                });
                it('should throw an error if the requested method is not a function', async () => {
                    (<any>window).dl_func = 'some-non-function-value';
                    try {
                        await (<any>inst).getContentImpl(scriptContent.name);
                    }
                    catch (e) {
                        expect(e.message).toMatch(/content .* not a function/i);
                        return;
                    }
                    finally {
                        delete (<any>window).dl_func;
                    }
                    expect(true).toBeFalsy();
                });
                it('should get all script dependencies before executing the requested function', async () => {
                    (<any>window).dl_func = function() { return 42; };
                    (<any>window).dl_func2 = function(first: number) { return first + 1; };
                    let result = await (<any>inst).getContentImpl(scriptDepContent.name);
                    expect(result).toBe(43);
                    delete (<any>window).dl_func;
                    delete (<any>window).dl_func2;
                });
                it('should allow dependencies to return promises', async () => {
                    (<any>window).dl_func = function() { return delay(100).then(() => 42); };
                    (<any>window).dl_func2 = function(first: number) { return first + 1; };
                    let result = await (<any>inst).getContentImpl(scriptDepContent.name);
                    expect(result).toBe(43);
                    delete (<any>window).dl_func;
                    delete (<any>window).dl_func2;
                });
            });
            
            describe(`when the content is unknown or invalid`, () => {
                it('should throw an error', async () => {
                    (<any>inst).schemaMap.set('name', { type: 'invalid', name: 'name' });
                    try {
                        await (<any>inst).getContentImpl('name');
                    }
                    catch (e) {
                        expect(e.message).toMatch(/invalid type for content/i);
                        return;
                    }
                    expect(true).toBeFalsy();
                });
            });
        });
        
        describe('.get', () => {
            it('should call getContentImpl', async () => {
                let expected = 'expected-content';
                spyOn(<any>inst, 'getContentImpl').and.returnValue(Promise.resolve(expected));
                let result = await inst.get('some-name');
                expect((<any>inst).getContentImpl).toHaveBeenCalled();
                expect(result).toBe(expected);
            });
            it('should cache the value returned by getContentImpl', async () => {
                let expected = 'expected-content';
                spyOn(<any>inst, 'getContentImpl').and.returnValue(Promise.resolve(expected));
                let result = await inst.get('some-name');
                let result2 = await inst.get('some-name');
                expect((<any>inst).getContentImpl).toHaveBeenCalledTimes(1);
                expect(result).toBe(result2);
            });
            it('should call getContentImpl only once even if the promise is not yet resolved', async () => {
                let expected = 'expected-content';
                spyOn(<any>inst, 'getContentImpl').and.returnValue(delay(100).then(() => expected));
                let resultPromise = inst.get('some-name');
                let result2 = await inst.get('some-name');
                let result = await resultPromise;
                expect((<any>inst).getContentImpl).toHaveBeenCalledTimes(1);
                expect(result).toBe(result2);
            });
        });
    });
});
