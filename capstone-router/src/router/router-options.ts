import { DependencyLoader } from '../dependency-loader/dependency-loader';
import { PlatformAdapter } from './platform-adapter/platform-adapter';

export type RouterOptions = {
    dependencyLoader?: DependencyLoader,
    platformAdapter?: PlatformAdapter
};
