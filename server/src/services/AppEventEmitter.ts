import EventEmitter from 'events';

EventEmitter.setMaxListeners(Infinity);

class AppEventEmitter extends EventEmitter {}

export const appEventEmitter = new AppEventEmitter();
