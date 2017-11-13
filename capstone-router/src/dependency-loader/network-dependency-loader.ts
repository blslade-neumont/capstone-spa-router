import { DependencyLoader } from './dependency-loader';
import { SchemaEntryT } from './schema';

interface BaseResourceT {
    isLoaded: boolean;
    loadPromise: Promise<void>;
    isContent: boolean;
}
interface ContentResourceT extends BaseResourceT {
    isContent: true;
    content: any;
}
interface ScriptResourceT extends BaseResourceT {
    isContent: false;
}
type ResourceT = ContentResourceT | ScriptResourceT;

declare let global: any;

export class NetworkDependencyLoader extends DependencyLoader {
    constructor() {
        super();
        this._global = typeof global !== 'undefined' ? global :
                       typeof window !== 'undefined' ? window :
                                                       null;
    }
    
    private _global: any;
    
    private resources = new Map<string, ResourceT>();
    
    private async loadContentResource(path: string) {
        let resource: ContentResourceT = <any>this.resources.get(path);
        if (resource && !resource.isContent) throw new Error(`The content file '${path}' has already been loaded as a script`);
        if (!resource) {
            let resolveFn: any, rejectFn: any;
            let promise = new Promise<void>((resolve, reject) => [resolveFn, rejectFn] = [resolve, reject]);
            resource = {
                isLoaded: false,
                isContent: true,
                loadPromise: promise,
                content: void(0)
            };
            this.resources.set(path, resource);
            this.eventsSubject.next({
                type: 'resource-load-begin',
                resourceType: 'text',
                path: path
            });
            let req = new XMLHttpRequest();
            req.onreadystatechange = function(this: XMLHttpRequest, e: Event) {
                if (this.readyState !== XMLHttpRequest.DONE) return;
                if (this.status !== 200) rejectFn(this.responseText);
                else {
                    resource.isLoaded = true;
                    resource.content = this.responseText;
                    resolveFn();
                }
            }
            req.open('GET', path);
            req.send();
            await resource.loadPromise;
            this.eventsSubject.next({
                type: 'resource-load-end',
                resourceType: 'text',
                path: path
            });
            return;
        }
        await resource.loadPromise;
    }
    private async executeScriptResource(path: string) {
        let resource: ScriptResourceT = <any>this.resources.get(path);
        if (resource && resource.isContent) throw new Error(`The script file '${path}' has already been loaded as content`);
        if (!resource) {
            let resolveFn: any;
            let promise = new Promise<void>(resolve => resolveFn = resolve);
            resource = {
                isLoaded: false,
                isContent: false,
                loadPromise: promise
            };
            this.resources.set(path, resource);
            this.eventsSubject.next({
                type: 'resource-load-begin',
                resourceType: 'script',
                path: path
            });
            let script = document.createElement('script');
            script.src = path;
            document.head.appendChild(script);
            if ((<any>script).readyState) {
                //IE
                (<any>script).onreadystatechange = function() {
                    if ((<any>script).readyState === "loaded" || (<any>script).readyState === "complete" ) {
                        (<any>script).onreadystatechange = null;
                        resource.isLoaded = true;
                        resolveFn();
                    }
                };
            } else {
                //Others
                script.onload = function() {
                    resource.isLoaded = true;
                    resolveFn();
                };
            }
            await resource.loadPromise;
            this.eventsSubject.next({
                type: 'resource-load-end',
                resourceType: 'script',
                path: path
            });
        }
        await resource.loadPromise;
    }
    
    async loadSchema(path: string): Promise<void> {
        this.eventsSubject.next({
            type: 'schema-load-begin',
            path: path
        });
        await this.loadContentResource(path);
        let schemaStr = (<ContentResourceT>this.resources.get(path)).content;
        let schemaObj: any;
        try {
            schemaObj = JSON.parse(schemaStr);
        }
        catch (e) {
            throw new Error(`Failed to parse schema json: ${e.msg || e.message || JSON.stringify(e)}`);
        }
        let schemaArr: SchemaEntryT[] = schemaObj.content;
        this.addSchema(schemaArr);
        this.eventsSubject.next({
            type: 'schema-load-end',
            path: path,
            added: schemaArr
        });
    }
    
    private async getContentImpl(name: string) {
        let meta = this.schemaMap.get(name);
        if (!meta) throw new Error(`Content ${name} is not defined in the schema`);
        
        this.eventsSubject.next({
            type: 'dep-load-begin',
            name: name
        });
        
        let content: any;
        
        let depNames = meta.deps || [];
        await Promise.all(depNames.map(dep => this.get<any>(dep)));
        
        switch (meta.type) {
        case "text":
            await this.loadContentResource(meta.src);
            content = (<ContentResourceT>this.resources.get(meta.src)).content;
            break;
            
        case "script":
            let argNames = meta.args || [];
            let allPromises = argNames.map(name => this.get<any>(name));
            allPromises.push(this.executeScriptResource(meta.src));
            let args = (await Promise.all(allPromises)).slice(0, argNames.length);
            let fn = this._global[meta.methodName];
            if (typeof fn !== 'function') throw new Error(`Content '${meta.name}' uses methodName ${meta.methodName}, which is not a function`);
            content = await fn(...args);
            break;
            
        default:
            throw new Error(`Invalid type for content '${name}': ${(<any>meta).type}`);
        }
        
        this.eventsSubject.next({
            type: 'dep-load-end',
            name: name,
            content: content
        });
        return content;
    }
    
    private contentCache = new Map<string, ContentResourceT>();
    async get<T>(name: string): Promise<T> {
        let resource = this.contentCache.get(name);
        
        if (typeof resource === 'undefined') {
            let contentPromise = this.getContentImpl(name);
            let resolveFn: any;
            let promise = new Promise<void>(resolve => resolveFn = resolve);
            resource = {
                isLoaded: false,
                isContent: true,
                loadPromise: promise,
                content: void(0)
            };
            this.contentCache.set(name, resource);
            let result = await contentPromise;
            resource.content = result;
            resource.isLoaded = true;
            resolveFn();
        }
        
        if (!resource.isLoaded) await resource.loadPromise;
        return resource.content;
    }
}
