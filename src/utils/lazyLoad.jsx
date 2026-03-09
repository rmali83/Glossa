import React, { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load wrapper with loading fallback
export const lazyLoad = (importFunc, fallback = <LoadingSpinner size="large" text="Loading..." />) => {
    const LazyComponent = lazy(importFunc);
    
    return (props) => (
        <Suspense fallback={fallback}>
            <LazyComponent {...props} />
        </Suspense>
    );
};

// Preload function for critical routes
export const preloadComponent = (importFunc) => {
    importFunc();
};

// Example usage:
// const Dashboard = lazyLoad(() => import('../pages/dashboard/Dashboard'));
// preloadComponent(() => import('../pages/dashboard/Dashboard'));
