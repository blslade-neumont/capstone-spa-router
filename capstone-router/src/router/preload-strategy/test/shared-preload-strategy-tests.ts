/// <reference types="jasmine" />

import { PreloadStrategy } from '../preload-strategy';
import { Router } from '../../router';
import { DependencyLoader, DummyDependencyLoader } from '../../../dependency-loader';
import { createMockRouter } from '../../test/mock-router';
import { RouteEntryT } from 'src';

export function sharedPreloadStrategyTests<T extends PreloadStrategy>(factoryFn: () => T, cleanupFn?: (inst: T) => void) {
    describe('shared functionality', () => {
        let inst: T;
        let router: Router;
        let dependencyLoader: DependencyLoader;
        beforeEach(() => {
            inst = factoryFn();
            router = createMockRouter();
            dependencyLoader = (<any>router).dependencyLoader = new DummyDependencyLoader();
        });
        afterEach(() => {
            if (cleanupFn) cleanupFn(inst);
        });
        
        describe('.init', () => {
            it('should throw an error if the router is invalid', () => {
                expect(() => inst.init(null)).toThrowError(/invalid router/i);
            });
            it('should throw an error if the preload strategy has already been initialized', () => {
                inst.init(router);
                expect(() => inst.init(router)).toThrowError(/already.* initialized/i);
            });
            it('should invoke initImpl', async () => {
                spyOn((<any>inst), 'initImpl');
                await inst.init(router);
                expect((<any>inst).initImpl).toHaveBeenCalledTimes(1);
            });
        });
        
        describe('.preloadRoute', () => {
            it('should throw an error if the preload strategy has not been initialized', async () => {
                try {
                    inst.preloadRoute([])
                }
                catch (e) {
                    expect(e.message).toMatch(/preload strategy.* not initialized/i);
                    return;
                }
                expect(false);
            });
            it('should invoke dependencyLoader.get for each dependency in the route tree', async () => {
                inst.init(router);
                spyOn(dependencyLoader, 'get').and.returnValue(Promise.resolve('Yay!'));
                let routes: RouteEntryT[] = [
                    { path: '', title: 'Some Title', template: { dep: 'template-dep' } },
                    { path: ':slug', title: { factory: 'title-factory-dep' }, template: { dep: 'template-dep-2' } }
                ];
                await inst.preloadRoute(routes);
                expect(dependencyLoader.get).toHaveBeenCalledTimes(3);
                expect(dependencyLoader.get).toHaveBeenCalledWith('template-dep');
                expect(dependencyLoader.get).toHaveBeenCalledWith('title-factory-dep');
                expect(dependencyLoader.get).toHaveBeenCalledWith('template-dep-2');
            });
            it('should not fail if there are no routes in the array', async () => {
                inst.init(router);
                inst.preloadRoute([]);
            });
            it('should return a promise', () => {
                inst.init(router);
                let result = inst.preloadRoute([]);
                expect(result instanceof Promise).toBe(true);
            });
            describe('that promise', () => {
                it('should not be rejected even if one of the dependencies cannot be loaded', async () => {
                    inst.init(router);
                    spyOn((<any>inst), 'logError');
                    spyOn(dependencyLoader, 'get').and.returnValue(Promise.reject('Oops!'));
                    await inst.preloadRoute([{ path: '', template: { dep: 'some-dep' } }]);
                    expect(dependencyLoader.get).toHaveBeenCalledWith('some-dep');
                    expect((<any>inst).logError).toHaveBeenCalledTimes(1);
                });
            });
        });
    });
}
