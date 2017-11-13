import { Router } from '@aboveyou00/capstone-router';

(async () => {
    let router = new Router();
    router.addNavigationProgressBar();
    (<any>window).router = router;
    (<any>window).navigateTo = router.navigateTo.bind(router);
    await router.dependencyLoader.loadSchema('/router-dependencies.json');
    await router.loadRoutes('routes');
})();
