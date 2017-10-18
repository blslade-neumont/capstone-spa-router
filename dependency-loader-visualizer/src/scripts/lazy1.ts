import { appendText } from '../util/append-text';

appendText('executed lazy1.bundle.js');

(<any>window).lazy1 = function() {
    appendText('entered lazy1');
    return 1;
};
