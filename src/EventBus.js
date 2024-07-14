"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    emit(event) {
        const eventConstructor = event.constructor;
        const callbacks = this.listeners.get(eventConstructor);
        if (callbacks) {
            for (const callback of callbacks) {
                callback(event);
            }
        }
    }
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        const callbacks = this.listeners.get(eventType);
        callbacks.push(callback);
    }
    off(eventType, callback) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}
exports.EventBus = EventBus;
