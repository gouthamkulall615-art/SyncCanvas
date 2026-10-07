import React, { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';

const SyncyRobot3D = lazy(() => import('./SyncyRobot3D'));

class RobotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Fail silently so WebGL or shader errors never break the landing page
    if (process.env.NODE_ENV === 'development') {
      console.warn('SyncyRobot3D failed to render:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function LazySyncyRobot({
  size = 180,
  mood = 'idle',
  waveDelay = 3,
  waveDuration = 3,
  dprMax = 1.5,
  className = '',
  style = {},
  ...rest
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Mount when near viewport (within 200px) and unmount when scrolled away to free WebGL context
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  const width = typeof size === 'number' ? `${size}px` : size;
  const height = typeof size === 'number' ? `${size * 1.25}px` : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        ...style,
      }}
      role="img"
      aria-label="Syncy, the SyncCanvas assistant"
    >
      {hasWebGL && isVisible && (
        <RobotErrorBoundary>
          <Suspense fallback={null}>
            <SyncyRobot3D
              size={size}
              mood={mood}
              waveDelay={waveDelay}
              waveDuration={waveDuration}
              dprMax={dprMax}
              {...rest}
            />
          </Suspense>
        </RobotErrorBoundary>
      )}
    </div>
  );
}
