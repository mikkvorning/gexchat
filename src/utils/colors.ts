/**
 * Converts a hex color string (e.g., "#FF0000") to an RGB object.
 * Uses regex to extract the red, green, and blue components.
 *
 * @example
 * hexToRgb("#FF0000") // returns { r: 255, g: 0, b: 0 }
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculates the relative luminance of a color using the WCAG 2.0 formula.
 * This is used to determine the perceived brightness of a color, accounting
 * for human perception of different colors:
 * - Green appears brightest (weight: 0.7152)
 * - Red appears dimmer (weight: 0.2126)
 * - Blue appears darkest (weight: 0.0722)
 *
 * Values are gamma-corrected for perceptual uniformity.
 *
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export const getRelativeLuminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  // Convert to sRGB and apply gamma correction
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );

  // Apply WCAG weights for human perception
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Determines if white text should be used on a given background color
 * based on the WCAG luminance calculation.
 *
 * The threshold of 0.5 is chosen as it represents the midpoint of
 * possible luminance values (0.0 to 1.0). Values below 0.5 are
 * considered dark enough to warrant white text.
 *
 * @example
 * shouldUseWhiteText("#000000") // returns true (use white on black)
 * shouldUseWhiteText("#FFFFFF") // returns false (use black on white)
 */
export const shouldUseWhiteText = (backgroundHex: string) => {
  const L = getRelativeLuminance(backgroundHex);
  return L < 0.5; // Use white text if background is dark
};

/**
 * Generates a stable color for an avatar based on an id string.
 * Uses a simple hash function to ensure the same id always gets the same color.
 *
 * @example
 * generateAvatarColor("user123") // returns a hex color like "#4a7b3c"
 */
export const generateAvatarColor = (id: string) => {
  // Use a simpler hash function that's stable between renders
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Get a positive hex color
  return `#${Math.abs(hash).toString(16).slice(0, 6).padEnd(6, '0')}`;
};
