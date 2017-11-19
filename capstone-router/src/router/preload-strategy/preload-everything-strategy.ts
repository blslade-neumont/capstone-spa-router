import { PreloadStrategy } from './preload-strategy';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import { RouteEntryT } from '../schema';

export class PreloadEverythingStrategy extends PreloadStrategy {
    constructor() {
        super();
    }
    
    async initImpl() {
        this.router.events
            .filter(ev => ev.type === 'end')
            .take(1)
            .subscribe(() => this.preloadEverything());
    }
    
    async preloadEverything() {
        let routes = await this.router.getRoutes();
        let flattened = this.flattenTree(routes);
        await this.preloadRoutes(flattened);
    }
    
    private flattenTree(routes: RouteEntryT[]): RouteEntryT[];
    private flattenTree(routes: RouteEntryT[], flattened: RouteEntryT[]): void;
    private flattenTree(routes: RouteEntryT[], flattened: RouteEntryT[] = []): RouteEntryT[] {
        flattened.push(...routes);
        for (let route of routes) {
            if (route.children) this.flattenTree(route.children, flattened);
        }
        return flattened;
    }
}
