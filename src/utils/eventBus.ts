export class EventBus {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((fn) => fn !== listener);
  }

  offAll(event: string) {
    if (!this.events[event]) return;
    this.events[event] = [];
  }

  once(event: string, listener: (...args: any[]) => void) {
    const fn = (...args: any[]) => {
      this.off(event, fn);
      listener(...args);
    };
    this.on(event, fn);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((fn) => fn(...args));
  }
}

export default new EventBus();
