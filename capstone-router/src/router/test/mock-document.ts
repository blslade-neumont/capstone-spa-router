import { EventEmitter } from './event-emitter';

export class MockElement extends EventEmitter {
    constructor(public readonly tagName: string) {
        super();
    }
    
    parentNode: MockElement | null = null;
    parentElement: MockElement | null = null;
    children: MockElement[] = [];
    
    appendChild(newChild: MockElement) {
        this.children.push(newChild);
        newChild.parentNode = newChild.parentElement = this;
    }
    removeChild(toRemove: MockElement) {
        let idx = this.children.indexOf(toRemove);
        if (idx === -1) throw new Error(`toRemove is not a child!`);
        this.children.splice(idx, 1);
        if (toRemove.parentElement === this) {
            toRemove.parentElement = toRemove.parentNode = null;
        }
    }
    insertBefore(newChild: MockElement, refChild: MockElement) {
        let idx = this.children.indexOf(refChild);
        if (idx === -1) throw new Error(`refChild is not a child!`);
        this.children.splice(idx, 0, newChild);
        newChild.parentNode = newChild.parentElement = this;
    }
    
    querySelector(selector: string) {
        return null;
    }
}

export class MockDocument extends EventEmitter {
    constructor() {
        super();
    }
    
    readyState: string = 'complete';
    
    private _elements: MockElement[] = [];
    createElement(tagName: string) {
        let el = new MockElement(tagName);
        this._elements.push(el);
        return el;
    }
    getElementsByTagName(tagName: string) {
        return this._elements.filter(el => el.tagName === tagName);
    }
    
    private _body: MockElement | null = null;
    get body() {
        if (!this._body) this._body = this.createElement('body');
        return this._body;
    }
}

export function createMockDocument(): Document {
    return <any>new MockDocument();
}
