import { DependencyLoader } from '../dependency-loader/dependency-loader';
import { PlatformAdapter } from './platform-adapter/platform-adapter';
import { PreloadStrategy } from './preload-strategy/preload-strategy';

export type RouterOptions = {
    dependencyLoader?: DependencyLoader,
    platformAdapter?: PlatformAdapter,
    preloadStrategy?: 'none' | 'follow-links' | 'all' | PreloadStrategy
};
