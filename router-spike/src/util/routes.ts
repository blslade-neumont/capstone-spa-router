

export type RouteT = {
    path: string,
    template: string
};

export const routes: RouteT[] = [{
    path: '/',
    template: require('../templates/home.tpl.html')
}, {
    path: 'about',
    template: require('../templates/about.tpl.html')
}, {
    path: 'page1',
    template: require('../templates/page1.tpl.html')
}, {
    path: 'page2',
    template: require('../templates/page2.tpl.html')
}, {
    path: 'page3',
    template: require('../templates/page3.tpl.html')
}];
