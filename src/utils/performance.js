// Performance monitoring utilities

export const measurePerformance = (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
};

export const measureAsyncPerformance = async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Memoization helper
export const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};

// Image lazy loading observer
export const createImageObserver = (callback) => {
    const options = {
        root: null,
        rootMargin: '50px',
        threshold: 0.01
    };

    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
            }
        });
    }, options);
};

// Report Web Vitals
export const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(onPerfEntry);
            getFID(onPerfEntry);
            getFCP(onPerfEntry);
            getLCP(onPerfEntry);
            getTTFB(onPerfEntry);
        });
    }
};

// Cache management
export class CacheManager {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    set(key, value, ttl = 300000) { // 5 minutes default
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        return this.cache.has(key) && Date.now() <= this.cache.get(key).expiry;
    }
}

// Create global cache instance
export const globalCache = new CacheManager();

// Batch API requests
export class RequestBatcher {
    constructor(batchFn, delay = 50) {
        this.batchFn = batchFn;
        this.delay = delay;
        this.queue = [];
        this.timer = null;
    }

    add(request) {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            
            if (this.timer) {
                clearTimeout(this.timer);
            }

            this.timer = setTimeout(() => {
                this.flush();
            }, this.delay);
        });
    }

    async flush() {
        if (this.queue.length === 0) return;

        const batch = [...this.queue];
        this.queue = [];

        try {
            const results = await this.batchFn(batch.map(item => item.request));
            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            batch.forEach(item => {
                item.reject(error);
            });
        }
    }
}
