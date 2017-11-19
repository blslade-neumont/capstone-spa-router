import { Router } from '../router';

export abstract class PreloadStrategy {
    constructor() { }
    
    abstract init(router: Router): Promise<void> | void;
}
