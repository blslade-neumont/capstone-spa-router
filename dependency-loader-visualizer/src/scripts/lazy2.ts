import { appendText } from '../util/append-text';

appendText('executed lazy2.bundle.js');

(<any>window).lazy2 = function(lazy1: number) {
    appendText('entered lazy2. lazy1:', lazy1);
    return 2;
};
