import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../constants/theme';

export interface BreakpointState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useBreakpoint(): BreakpointState {
  const { width, height } = useWindowDimensions();

  const isMobile = width <= BREAKPOINTS.mobileMax;
  const isTablet = width >= BREAKPOINTS.tabletMin && width < BREAKPOINTS.desktopMin;
  const isDesktop = width >= BREAKPOINTS.desktopMin;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
  };
}
