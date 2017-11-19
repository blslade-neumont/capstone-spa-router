import { PreloadStrategy } from './preload-strategy';

export class PreloadNothingStrategy extends PreloadStrategy {
    constructor() {
        super();
    }
    
    async init() { }
}
