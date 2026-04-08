export class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  async wait() {
    const now = Date.now();
    this.calls = this.calls.filter((t) => now - t < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.calls = this.calls.filter((t) => Date.now() - t < this.windowMs);
    }

    this.calls.push(Date.now());
  }
}
