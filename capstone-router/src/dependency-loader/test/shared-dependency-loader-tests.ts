/// <reference types="jasmine" />

import { DependencyLoader } from '../dependency-loader';
import { SchemaT } from '../../shared/schema';
import { DependencyLoaderEventT } from '../../shared/events';

export function sharedDependencyLoaderTests<T extends DependencyLoader>(factoryFn: () => T, cleanupFn?: (inst: T) => void) {
    describe('shared functionality', () => {
        let inst: T;
        beforeEach(() => {
            inst = factoryFn();
        });
        afterEach(() => {
            if (cleanupFn) cleanupFn(inst);
        });
        
        describe('.addSchema', () => {
            it('should call validateSchema with the passed-in schema', () => {
                let validateSchemaSpy = spyOn(<any>inst, 'validateSchema').and.stub();
                let schema = [];
                inst.addSchema(schema);
                expect(validateSchemaSpy).toHaveBeenCalledWith(schema);
            });
            it('should add the schema keys to the schema map', () => {
                expect(inst.has('testKey')).toBeFalsy();
                inst.addSchema([{
                    type: 'text',
                    name: 'testKey',
                    src: 'blah.txt'
                }]);
                expect(inst.has('testKey')).toBeTruthy();
            });
            it(`should emit a 'schema-added' event`, () => {
                let eventsRecieved: DependencyLoaderEventT[] = [];
                let subscription = inst.events.subscribe(e => eventsRecieved.push(e));
                inst.addSchema([]);
                subscription.unsubscribe();
                expect(eventsRecieved.length).toEqual(1);
                expect(eventsRecieved[0].type).toBe('schema-added');
            });
        });
        
        describe('.validateSchema', () => {
            it('should prevent duplicate schema entries', () => {
                let schema: SchemaT = [
                    { type: 'text', name: 'one', src: 'source.txt' },
                    { type: 'text', name: 'one', src: 'source2.txt' }
                ];
                expect(() => (<any>inst).validateSchema(schema)).toThrowError(/defined twice/i);
            });
            it('should prevent schema entries using names that are already defined in previous schema', () => {
                let schema1: SchemaT = [
                    { type: 'text', name: 'one', src: 'source.txt' }
                ];
                let schema2: SchemaT = [
                    { type: 'text', name: 'one', src: 'source2.txt' }
                ];
                (<any>inst).addSchema(schema1);
                expect(() => (<any>inst).validateSchema(schema2)).toThrowError(/defined twice/i);
            });
            it('should prevent a script path from being used as a content resource', () => {
                let schema: SchemaT = [
                    { type: 'script', name: 'one', src: 'source.txt', methodName: 'entry' },
                    { type: 'text', name: 'two', src: 'source.txt' }
                ];
                expect(() => (<any>inst).validateSchema(schema)).toThrowError(/loaded as a script and as content/i);
            });
            it('should prevent a content path from being used as a script resource', () => {
                let schema: SchemaT = [
                    { type: 'text', name: 'one', src: 'source.txt' },
                    { type: 'script', name: 'two', src: 'source.txt', methodName: 'entry' }
                ];
                expect(() => (<any>inst).validateSchema(schema)).toThrowError(/loaded as a script and as content/i);
            });
            it('should not throw if all schema definitions are valid', () => {
                let schema: SchemaT = [
                    { type: 'text', name: 'one', src: 'source.txt' },
                    { type: 'script', name: 'two', src: 'source2.txt', methodName: 'entry' }
                ];
                expect(() => (<any>inst).validateSchema(schema)).not.toThrowError();
            });
            it('should not throw if there are no schema definitions', () => {
                let schema: SchemaT = [];
                expect(() => (<any>inst).validateSchema(schema)).not.toThrowError();
            });
            it('should prevent schema entries using invalid or unknown content types', () => {
                let schema: SchemaT = [
                    <any>{ type: 'unknown', name: 'one', src: 'source.txt' }
                ];
                expect(() => (<any>inst).validateSchema(schema)).toThrowError(/invalid content type/i);
            });
        });
        
        describe('.has', () => {
            it('should return false for unrecognized names', () => {
                expect(inst.has('fish-n-chips')).toBeFalsy();
            });
            it('should return true if the name exists in any schema entry', () => {
                inst.addSchema([{ type: 'text', src: 'path.txt', name: 'nameInSchema' }]);
                expect(inst.has('nameInSchema')).toBeTruthy();
            });
        });
        
        describe('.try', () => {
            it('should return the default value if the name is not in the schema', async () => {
                let expected = 'my-default-value';
                expect(await inst.try('some-name', expected)).toBe(expected);
            });
            it('should invoke get if the name is in the schema', async () => {
                let expected = 'my-default-value';
                spyOn(inst, 'get').and.returnValue(Promise.resolve(expected));
                inst.addSchema([{ type: 'text', src: 'path.txt', name: 'some-defined-name' }]);
                let result = await inst.try('some-defined-name', 'XXX');
                expect(result).toBe(expected);
            });
        });
    });
}
