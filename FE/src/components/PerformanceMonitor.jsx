import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component debug performance - đo thời gian load và số lần render
 */
export default function PerformanceMonitor({ componentName = 'Unknown' }) {
  const location = useLocation();
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastLocation = useRef(location.pathname);

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    
    const isNewPage = location.pathname !== lastLocation.current;
    lastLocation.current = location.pathname;

    console.log(`🔍 [${componentName}] Render #${renderCount.current}`, {
      pathname: location.pathname,
      isNewPage,
      timeSinceMount: `${timeSinceMount}ms`,
      timestamp: new Date().toISOString(),
    });

    if (isNewPage) {
      renderCount.current = 1;
      mountTime.current = now;
    }
  });

  return null; // Invisible component
}

/**
 * Hook để đo thời gian API calls
 */
export function useAPITimer(apiName) {
  return {
    start: () => {
      const startTime = Date.now();
      console.log(`⏱️ [API START] ${apiName}`);
      return {
        end: (success = true) => {
          const duration = Date.now() - startTime;
          console.log(
            `${success ? '✅' : '❌'} [API END] ${apiName} - ${duration}ms`
          );
        },
      };
    },
  };
}

/**
 * HOC để wrap component và đo performance
 */
export function withPerformanceMonitor(Component, name) {
  return function WrappedComponent(props) {
    return (
      <>
        <PerformanceMonitor componentName={name} />
        <Component {...props} />
      </>
    );
  };
}
