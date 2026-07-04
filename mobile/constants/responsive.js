import { useWindowDimensions, Platform } from "react-native";

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLandscape = width > height;
  const scale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;

  const moderateScale = (size, factor = 0.5) =>
    size + (scale - 1) * size * factor;

  const fontScale = (size) => {
    if (isTablet) return moderateScale(size, 0.4);
    return moderateScale(size, 0.3);
  };

  const vs = (size) => {
    const base = size * heightScale;
    if (isLandscape) return Math.min(base, size * 1.2);
    return base;
  };

  const hs = (size) => size * scale;

  return {
    width,
    height,
    isTablet,
    isLandscape,
    scale,
    fontScale,
    hs,
    vs,
    moderateScale,
  };
};

export const TABLET_MIN_WIDTH = 768;
