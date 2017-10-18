import { SchemaT, SchemaEntryT, SimpleContentMetaT, DynamicContentMetaT } from './schema';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { DependencyLoaderEventT } from './events';

export abstract class DependencyLoader {
    constructor() { }
    
    protected eventsSubject = new Subject<DependencyLoaderEventT>();
    readonly events = this.eventsSubject.asObservable();
    
    abstract loadSchema(path: string): Promise<void>;
    
    protected schemaMap = new Map<string, SchemaEntryT>();
    private contentPaths: string[] = [];
    private scriptPaths: string[] = [];
    addSchema(schema: SchemaT): void {
        this.validateSchema(schema);
        for (let meta of schema) {
            this.schemaMap.set(meta.name, meta);
        }
        this.eventsSubject.next({
            type: 'schema-added',
            added: schema
        });
    }
    private validateSchema(schema: SchemaT) {
        //TODO: check entries already added to the schema map
        let names: string[] = [];
        for (let meta of schema) {
            let name = meta.name;
            let idx = names.indexOf(name);
            if (idx !== -1 || this.schemaMap.has(name)) throw new Error(`Content '${name}' defined twice.`);
            names.push(name);
            
            let src = meta.src;
            let type = meta.type;
            if (type === 'text') {
                idx = this.scriptPaths.indexOf(src);
                if (idx !== -1) throw new Error(`Resource at '${src}' is loaded as a script and as content`);
                idx = this.contentPaths.indexOf(src);
                if (idx === -1) this.contentPaths.push(src);
            }
            else if (type === 'script') {
                idx = this.contentPaths.indexOf(src);
                if (idx !== -1) throw new Error(`Resource at '${src}' is loaded as a script and as content`);
                idx = this.scriptPaths.indexOf(src);
                if (idx === -1) this.scriptPaths.push(src);
            }
            else throw new Error(`Invalid content type for content '${name}': '${type}'`);
        }
    }
    
    has<T>(name: string): boolean {
        return this.schemaMap.has(name);
    }
    
    abstract get<T>(name: string): Promise<T>;
    async try<T>(name: string, defaultValue: T): Promise<T> {
        if (!this.has(name)) return defaultValue;
        else return await this.get<T>(name);
    }
}
