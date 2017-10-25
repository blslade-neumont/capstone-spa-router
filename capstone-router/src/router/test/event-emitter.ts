

export class EventEmitter {
    constructor() { }
    
    private _eventHandlers: [string, Function][] = [];
    addEventListener(name: string, handler: Function) {
        this._eventHandlers.push([name, handler]);
    }
    emitEvent(name: string, e: any) {
        this._eventHandlers
            .filter(([forName]) => forName === name)
            .forEach(([_, handler]) => handler(e));
    }
}
