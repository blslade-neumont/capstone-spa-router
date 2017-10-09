import { appendText } from '../util/append-text';

appendText('executed lazy3.bundle.js');

(<any>window).lazy3A = function() {
    appendText('entered lazy3A');
    return '3a';
};

(<any>window).lazy3B = function(staticText: string) {
    appendText('entered lazy3B. staticText:', staticText);
    return '3b';
};

(<any>window).lazy3C = function(lazy1: number, lazy2: number, lazy3a: string, lazy3b: string) {
    appendText('entered lazy3C. lazy1:', lazy1, 'lazy2:', lazy2, 'lazy3a:', lazy3a, 'lazy3b:', lazy3b);
    return '3b';
};
