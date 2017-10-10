

export type RouteT = {
    path: string,
    title?: string,
    template: string
};

export const routes: RouteT[] = [{
    path: '/',
    title: 'Home',
    template: require('../templates/home.tpl.html')
}, {
    path: 'about',
    title: 'About',
    template: require('../templates/about.tpl.html')
}, {
    path: 'page1',
    title: 'Page 1',
    template: require('../templates/page1.tpl.html')
}, {
    path: 'page2',
    title: 'Page 2',
    template: require('../templates/page2.tpl.html')
}, {
    path: 'page3',
    title: 'Page 3',
    template: require('../templates/page3.tpl.html')
}];
