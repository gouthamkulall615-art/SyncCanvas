import { useEffect, useState } from 'react';
import LazySyncyRobot from '../ui/LazySyncyRobot';

const WAVE_DELAY = 3;
const WAVE_DURATION = 3;

export default function HeroSyncyRobot() {
  const [robotSize, setRobotSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 150 : 96
  );
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setRobotSize(window.innerWidth >= 768 ? 150 : 96);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);

    window.addEventListener('resize', handleResize);
    mediaQuery.addEventListener('change', handleMotionChange);

    // Initial 3-second wave timing
    const showTimer = setTimeout(() => {
      setBubbleVisible(true);
    }, WAVE_DELAY * 1000);

    const hideTimer = setTimeout(() => {
      setBubbleVisible(false);
    }, (WAVE_DELAY + WAVE_DURATION) * 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleWave = () => {
    setBubbleVisible(true);
    setTimeout(() => {
      setBubbleVisible(false);
    }, WAVE_DURATION * 1000);
  };

  return (
    <div
      className="hidden sm:block absolute z-20 -top-20 md:-top-24 right-4 md:right-8 lg:right-12 pointer-events-none"
      aria-label="Syncy mascot on demo frame"
    >
      <div className="relative flex items-center">
        {/* Speech label */}
        {bubbleVisible && (
          <div
            className={`absolute right-full mr-2.5 top-8 md:top-12 whitespace-nowrap px-2.5 py-1 text-[13px] leading-tight text-zinc-200 bg-[#1a1d24] border border-zinc-800 rounded select-none shadow-none pointer-events-none z-30 ${
              prefersReducedMotion ? '' : 'transition-opacity duration-200'
            }`}
            role="status"
            aria-live="polite"
          >
            Hi, I'm Syncy
          </div>
        )}

        {/* 3D Robot */}
        <div className="pointer-events-auto">
          <LazySyncyRobot
            size={robotSize}
            mood="idle"
            waveDelay={WAVE_DELAY}
            waveDuration={WAVE_DURATION}
            dprMax={1.5}
            onWave={handleWave}
          />
        </div>
      </div>
    </div>
  );
}
