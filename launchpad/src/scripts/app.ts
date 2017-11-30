import { Router } from '@aboveyou00/capstone-router';
import 'rxjs/add/operator/filter';

function beginCountups(router: Router) {
    let interval: any = null;
    router.events.subscribe(ev => {
        if (ev.type === 'begin') {
            if (interval) clearInterval(interval);
            interval = null;
        }
        else if (ev.type === 'end') {
            let count = 3, countFrom = 3;
            let countup = document.getElementById("countup");
            if (countup !== null) {
                interval = setInterval(() => {
                    // --count;
                    ++count;
                    let minCount = Math.floor((countFrom * 2) / 3);
                    countup.innerHTML = (count < minCount ? minCount : count) + '';
                    if (count <= minCount - 1) {
                        countFrom = Math.ceil(countFrom * 1.4);
                        count = countFrom;
                    }
                }, 1000);
            }
        }
    });
}

(async () => {
    let router = new Router();
    router.addNavigationProgressBar();
    (<any>window).router = router;
    (<any>window).navigateTo = router.navigateTo.bind(router);
    await router.dependencyLoader.loadSchema('/router-dependencies.json');
    await router.loadRoutes('routes');
    
    beginCountups(router);
})();
