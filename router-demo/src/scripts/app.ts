import { Router } from '@aboveyou00/capstone-router';

(async () => {
    let router = new Router({ preloadStrategy: 'follow-links' });
    router.preloadStrategy.delayPreloadMillis = 2000;
    router.addNavigationProgressBar();
    await router.dependencyLoader.loadSchema('/router-dependencies.json');
    await router.loadRoutes('routes');
})();
