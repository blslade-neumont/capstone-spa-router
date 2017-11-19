import { PreloadStrategy } from './preload-strategy';
import { PreloadNothingStrategy } from './preload-nothing-strategy';
import { FollowLinksPreloadStrategy } from './follow-links-preload-strategy';
import { PreloadEverythingStrategy } from './preload-everything-strategy';

export function createPreloadStrategy(strategy?: 'none' | 'follow-links' | 'all' | PreloadStrategy): PreloadStrategy {
    if (typeof strategy === 'undefined') strategy = 'none';
    
    if (strategy instanceof PreloadStrategy) return strategy;
    
    switch (strategy) {
    case 'none':
        return new PreloadNothingStrategy();
        
    case 'follow-links':
        return new FollowLinksPreloadStrategy();
        
    case 'all':
        return new PreloadEverythingStrategy();
        
    default:
        throw new Error(`Invalid preload strategy: '${strategy}'`);
    }
}
