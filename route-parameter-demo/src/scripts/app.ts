import { Router } from '@aboveyou00/capstone-router';

(async () => {
    let router = new Router();
    (<any>window).router = router;
    (<any>window).navigateTo = router.navigateTo.bind(router);
    await router.dependencyLoader.loadSchema('/dependencies.json');
    await router.loadRoutes('routes');
})();
