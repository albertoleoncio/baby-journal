// Simple global request queue to limit concurrent client fetches
type Task<T> = () => Promise<T>;

class RequestQueue {
  private maxConcurrent: number;
  private running = 0;
  private queue: Array<{
    task: Task<any>;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  add<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.drain();
    });
  }

  private drain() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) break;
      this.running++;
      next
        .task()
        .then((v) => next.resolve(v))
        .catch((e) => next.reject(e))
        .finally(() => {
          this.running--;
          this.drain();
        });
    }
  }
}

// Export a singleton to share concurrency across all PostCards
export const requestQueue = new RequestQueue(3);
