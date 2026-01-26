/**
 * Font Loader Utility
 *
 * Automatically loads and manages fonts for the GameByte framework.
 * Ensures fonts are available before UI components render.
 */

// Default framework font configuration
// Lilita One - Playful, game-style display font
const FRAMEWORK_FONT = {
  family: 'Lilita One',
  googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap'
};

let fontLoadPromise: Promise<void> | null = null;
let fontLoaded = false;

/**
 * Inject Google Fonts stylesheet if not already present
 * Returns a promise that resolves when the stylesheet is loaded
 */
function injectFontStylesheet(): Promise<void> {
  return new Promise((resolve) => {
    // Check if already injected
    const existingLink = document.querySelector(`link[href*="Lilita+One"]`) as HTMLLinkElement;
    if (existingLink) {
      // Already exists, check if loaded
      if (existingLink.sheet) {
        resolve();
      } else {
        existingLink.addEventListener('load', () => resolve());
        existingLink.addEventListener('error', () => resolve()); // Resolve anyway on error
      }
      return;
    }

    // Add preconnect for faster loading
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    // Add font stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FRAMEWORK_FONT.googleFontsUrl;

    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => resolve()); // Resolve anyway on error

    document.head.appendChild(link);
  });
}

/**
 * Check if the framework font is loaded
 */
function isFontLoaded(): boolean {
  if (typeof document === 'undefined' || !document.fonts) {
    return true; // SSR or no Font API support
  }
  return document.fonts.check(`400 24px ${FRAMEWORK_FONT.family}`);
}

/**
 * Load the framework font
 * Returns a promise that resolves when the font is ready
 */
export async function loadFrameworkFont(): Promise<void> {
  // Return cached promise if already loading
  if (fontLoadPromise) {
    return fontLoadPromise;
  }

  // Already loaded
  if (fontLoaded) {
    return Promise.resolve();
  }

  fontLoadPromise = (async () => {
    // Skip if no document (SSR)
    if (typeof document === 'undefined') {
      fontLoaded = true;
      return;
    }

    // Check if already loaded
    if (isFontLoaded()) {
      fontLoaded = true;
      return;
    }

    // Inject stylesheet and wait for it to load
    await injectFontStylesheet();

    // Create hidden element to trigger font load
    const preload = document.createElement('div');
    preload.style.cssText = `
      font-family: '${FRAMEWORK_FONT.family}', sans-serif;
      font-weight: 400;
      position: absolute;
      left: -9999px;
      visibility: hidden;
      pointer-events: none;
    `;
    preload.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    document.body.appendChild(preload);

    // Poll until font is loaded or timeout
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 5 seconds max

      const checkFont = () => {
        attempts++;

        if (isFontLoaded()) {
          preload.remove();
          fontLoaded = true;
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          // Timeout - resolve anyway to prevent blocking
          console.warn('GameByte: Font loading timeout, using fallback');
          preload.remove();
          fontLoaded = true;
          resolve();
          return;
        }

        setTimeout(checkFont, 50);
      };

      // Start checking immediately since stylesheet is already loaded
      checkFont();
    });
  })();

  return fontLoadPromise;
}

/**
 * Get the framework font family string for use in styles
 * Includes emoji font fallbacks for cross-platform emoji support
 */
export function getFrameworkFontFamily(): string {
  return `"${FRAMEWORK_FONT.family}", "Fredoka", "Arial Black", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
}

/**
 * Check if font is ready (non-blocking)
 */
export function isFontReady(): boolean {
  return fontLoaded;
}

/**
 * Reset font loader state (for testing)
 */
export function resetFontLoader(): void {
  fontLoadPromise = null;
  fontLoaded = false;
}
