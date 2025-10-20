// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  start(label) {
    this.startTimes.set(label, performance.now());
  }

  end(label) {
    const startTime = this.startTimes.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.set(label, duration);
      this.startTimes.delete(label);
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Log performance summary
  logSummary() {
    const metrics = this.getMetrics();
    console.log('📊 Performance Summary:', metrics);
    
    const totalTime = Object.values(metrics).reduce((sum, time) => sum + time, 0);
    console.log(`⏱️ Total tracked time: ${totalTime.toFixed(2)}ms`);
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Performance decorator for functions
export const withPerformance = (label) => (fn) => {
  return async (...args) => {
    perfMonitor.start(label);
    try {
      const result = await fn(...args);
      perfMonitor.end(label);
      return result;
    } catch (error) {
      perfMonitor.end(label);
      throw error;
    }
  };
};

// React performance hook
export const usePerformance = () => {
  const start = (label) => perfMonitor.start(label);
  const end = (label) => perfMonitor.end(label);
  const getMetrics = () => perfMonitor.getMetrics();
  const logSummary = () => perfMonitor.logSummary();

  return { start, end, getMetrics, logSummary };
};

export default PerformanceMonitor;
