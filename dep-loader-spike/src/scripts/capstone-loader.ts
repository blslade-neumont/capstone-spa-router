

// let scripts: string[] = [
//     'scripts/lazy1.bundle.js',
//     'scripts/lazy2.bundle.js',
//     'scripts/lazy3.bundle.js'
// ];
// scripts.forEach(src => {
//     let script = document.createElement('script');
//     script.src = src;
//     script.async = false;
//     document.head.appendChild(script);
// });

interface BaseResourceT {
    isLoaded: boolean;
    loadPromise: Promise<void>;
    isContent: boolean;
}
interface ContentResourceT extends BaseResourceT {
    isContent: true;
    content: string;
}
interface ScriptResourceT extends BaseResourceT {
    isContent: false;
}
type ResourceT = ContentResourceT | ScriptResourceT;

interface BaseContentMetaT {
    name: string;
    type: string;
    src: string;
}
interface SimpleContentMetaT extends BaseContentMetaT {
    type: "text";
}
interface DynamicContentMetaT extends BaseContentMetaT {
    type: "script";
    methodName: string;
    deps?: string[];
}
type ContentMetaT = SimpleContentMetaT | DynamicContentMetaT;

declare let global: any;

(() => {
    let _global = typeof global !== 'undefined' ? global :
                  typeof window !== 'undefined' ? window :
                                                  null;
    if (!_global) throw new Error(`Could not find global object. 'global' and 'window' are both undefined.`);
    
    let resources = new Map<string, ResourceT>();
    async function loadContentResource(path: string) {
        let resource: ContentResourceT = <any>resources.get(path);
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
            resources.set(path, resource);
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
        }
        return void(await resource.loadPromise);
    }
    async function executeScriptResource(path: string) {
        let resource: ScriptResourceT = <any>resources.get(path);
        if (resource && resource.isContent) throw new Error(`The script file '${path}' has already been loaded as content`);
        if (!resource) {
            let resolveFn: any;
            let promise = new Promise<void>(resolve => resolveFn = resolve);
            resource = {
                isLoaded: false,
                isContent: false,
                loadPromise: promise
            };
            resources.set(path, resource);
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
        }
        return void(await resource.loadPromise);
    }
    
    function validateSchema(schema: ContentMetaT[]) {
        let names: string[] = [], content: string[] = [], scripts: string[] = [];
        for (let meta of schema) {
            let name = meta.name;
            let idx = names.indexOf(name);
            if (idx !== -1) throw new Error(`Content '${name}' defined twice.`);
            
            let src = meta.src;
            let type = meta.type;
            if (type === 'text') {
                idx = scripts.indexOf(src);
                if (idx !== -1) throw new Error(`Resource at '${src}' is loaded as a script and as content`);
                idx = content.indexOf(src);
                if (idx === -1) content.push(src);
            }
            else if (type === 'script') {
                idx = content.indexOf(src);
                if (idx !== -1) throw new Error(`Resource at '${src}' is loaded as a script and as content`);
                idx = scripts.indexOf(src);
                if (idx === -1) scripts.push(src);
            }
            else throw new Error(`Invalid content type for content '${name}': '${type}'`);
        }
    }
    async function loadSchema(path: string): Promise<Map<string, ContentMetaT>> {
        await loadContentResource(path);
        let schemaStr = (<ContentResourceT>resources.get(path)).content;
        let schemaObj: any;
        try {
            schemaObj = JSON.parse(schemaStr);
        }
        catch (e) {
            throw new Error(`Failed to parse schema json: ${e.msg || e.message || JSON.stringify(e)}`);
        }
        let schemaArr: ContentMetaT[] = schemaObj.content;
        validateSchema(schemaArr);
        let map = new Map<string, ContentMetaT>();
        for (let meta of schemaArr) {
            map.set(meta.name, meta);
        }
        return map;
    }
    let schemaPromise = loadSchema("/router.json");
    
    async function getContentImpl(name: string) {
        let schema = await schemaPromise;
        let meta = schema.get(name);
        if (!meta) throw new Error(`Content ${name} is not defined in the schema`);
        
        switch (meta.type) {
        case "text":
            await loadContentResource(meta.src);
            return (<ContentResourceT>resources.get(meta.src)).content;
            
        case "script":
            await executeScriptResource(meta.src);
            let deps = await Promise.all((meta.deps || []).map(getContent));
            let fn = _global[meta.methodName];
            if (typeof fn !== 'function') throw new Error(`Content '${meta.name}' uses methodName ${meta.methodName}, which is not a function`);
            return await fn(...deps);
            
        default:
            throw new Error(`Invalid type for content '${name}': ${(<any>meta).type}`);
        }
    }
    let content = new Map<string, ContentResourceT>();
    async function getContent(name: string) {
        let resource = content.get(name);
        
        if (typeof resource === 'undefined') {
            let contentPromise = getContentImpl(name);
            let resolveFn: any;
            let promise = new Promise<void>(resolve => resolveFn = resolve);
            resource = {
                isLoaded: false,
                isContent: true,
                loadPromise: promise,
                content: void(0)
            };
            content.set(name, resource);
            let result = await contentPromise;
            resource.content = result;
            resource.isLoaded = true;
            resolveFn();
        }
        
        if (!resource.isLoaded) await resource.loadPromise;
        return resource.content;
    }
    if (_global.getContent) throw new Error(`Can't overwrite (global/window).getContent.`);
    _global.getContent = getContent;
})();

declare function getContent(name: string): Promise<any>;

getContent('lazy3-c').then(val => console.log('lazy3-c', val));
