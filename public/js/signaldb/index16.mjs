import { EventEmitter as EventEmitter$1 } from "events";
class EventEmitter extends EventEmitter$1 {
  on(event, listener) {
    super.on(event, listener);
    return this;
  }
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
}
export {
  EventEmitter as default
};
