// Performance monitoring utilities

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
      return duration;
    }
    return 0;
  }

  getMetric(label) {
    return this.metrics.get(label);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  logMetrics() {
    console.group('Performance Metrics');
    this.metrics.forEach((duration, label) => {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Higher-order function for performance monitoring
export const withPerformanceMonitoring = (fn, label) => {
  return async (...args) => {
    performanceMonitor.start(label);
    try {
      const result = await fn(...args);
      performanceMonitor.end(label);
      return result;
    } catch (error) {
      performanceMonitor.end(label);
      throw error;
    }
  };
};

// React hook for performance monitoring
export const usePerformanceMonitor = (label, dependencies = []) => {
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    performanceMonitor.start(label);
    return () => {
      const duration = performanceMonitor.end(label);
      setDuration(duration);
    };
  }, dependencies);

  return duration;
};
