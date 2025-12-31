class PromiseQueue {
  constructor() {
    this.queue = [];
    this.pendingPromise = false;
  }
  /**
   * Method to add a new promise to the queue and returns a promise that resolves when this task is done
   * @param task Function that returns a promise that will be added to the queue
   * @returns Promise that resolves when the task is done
   */
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push(() => task().then(resolve).catch((error) => {
        reject(error);
        throw error;
      }));
      this.dequeue();
    });
  }
  /**
   * Method to check if there is a pending promise in the queue
   * @returns True if there is a pending promise, false otherwise
   */
  hasPendingPromise() {
    return this.pendingPromise;
  }
  /**
   * Method to process the queue
   */
  dequeue() {
    if (this.pendingPromise || this.queue.length === 0) {
      return;
    }
    const task = this.queue.shift();
    if (!task)
      return;
    this.pendingPromise = true;
    task().then(() => {
      this.pendingPromise = false;
      this.dequeue();
    }).catch(() => {
      this.pendingPromise = false;
      this.dequeue();
    });
  }
}
export {
  PromiseQueue as default
};
