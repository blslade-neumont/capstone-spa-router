import { DependencyLoader } from './dependency-loader';
import { delay } from './util/delay';

export class DummyDependencyLoader extends DependencyLoader {
    constructor(private delay: number = 0) {
        super();
    }
    
    async loadSchema(path: string): Promise<void> {
        throw new Error("Not supported.");
    }
    
    private contentCache = new Map<string, any>();
    provide<T>(name: string, value: T) {
        if (!this.has(name)) throw new Error(`Resource '${name}' is not defined in the schema.`);
        if (this.contentCache.has(name)) throw new Error(`A value for resource '${name}' is already provided.`);
        this.eventsSubject.next({
            type: 'dep-load-begin',
            name: name
        });
        this.contentCache.set(name, value);
        this.eventsSubject.next({
            type: 'dep-load-end',
            name: name,
            content: value
        });
    }
    async get<T>(name: string): Promise<T> {
        if (this.delay) await delay(this.delay);
        if (!this.contentCache.has(name)) throw new Error(`No value for resource '${name}' has been provided.`);
        return this.contentCache.get(name);
    }
}
