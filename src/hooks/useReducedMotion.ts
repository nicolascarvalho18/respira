import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAuthStore } from '../store/authStore';

export function useReducedMotion(): boolean {
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const userReducedMotion = useAuthStore(
    (state) => state.user?.preferences?.reducedMotion ?? false
  );

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setSystemReducedMotion(enabled);
      })
      .catch(() => {
        if (isMounted) setSystemReducedMotion(false);
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) setSystemReducedMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return systemReducedMotion || userReducedMotion;
}
