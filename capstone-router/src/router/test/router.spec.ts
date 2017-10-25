/// <reference types="jasmine" />

import { Router } from '../router';
import { DependencyLoader } from '../../dependency-loader/dependency-loader';
import { DummyDependencyLoader } from '../../dependency-loader/dummy-dependency-loader';

describe('Router', () => {
    let inst: Router;
    let deps: DependencyLoader;
    beforeEach(() => {
        deps = new DummyDependencyLoader();
        inst = new Router(deps);
    });
    
    describe('.ctor', () => {
        
    });
    
    describe('.ensureInitialized', () => {
        
    });
    
    describe('.init', () => {
        
    });
    
    describe('.loadRoutes', () => {
        
    });
    
    describe('.validateRoutes', () => {
        
    });
    
    describe('.validateRoute', () => {
        
    });
    
    describe('.getRoutes', () => {
        
    });
    
    describe('.currentRoute', () => {
        
    });
    
    describe('.validateRoutes', () => {
        describe('get', () => {
            
        });
    });
    
    describe('.navigateTo', () => {
        
    });
    
    describe('.loadRouteTemplates', () => {
        
    });
    
    describe('.findBestRoute', () => {
        
    });
});
