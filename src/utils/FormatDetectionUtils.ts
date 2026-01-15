/**
 * Unified format detection utilities for the GameByte framework.
 * Consolidates texture and audio format detection with caching.
 *
 * @module FormatDetectionUtils
 */

/**
 * Supported texture formats.
 */
export interface TextureFormats {
  webp: boolean;
  avif: boolean;
  dxt: boolean;
  etc: boolean;
  astc: boolean;
  png: boolean;
  jpeg: boolean;
}

/**
 * Supported audio formats.
 */
export interface AudioFormats {
  mp3: boolean;
  ogg: boolean;
  webm: boolean;
  aac: boolean;
  wav: boolean;
}

/**
 * Cache for format detection results.
 */
let cachedTextureFormats: TextureFormats | null = null;
let cachedAudioFormats: AudioFormats | null = null;
let cachedSupportedTextureFormatsArray: string[] | null = null;
let cachedSupportedAudioFormatsArray: string[] | null = null;

/**
 * Check if a WebGL extension is supported.
 */
function checkWebGLExtension(extensionName: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    return false;
  }

  return !!(gl as WebGLRenderingContext).getExtension(extensionName);
}

/**
 * Detect supported texture formats.
 */
export function detectTextureFormats(): TextureFormats {
  if (cachedTextureFormats) {
    return cachedTextureFormats;
  }

  if (typeof document === 'undefined') {
    cachedTextureFormats = {
      webp: false,
      avif: false,
      dxt: false,
      etc: false,
      astc: false,
      png: true,
      jpeg: true,
    };
    return cachedTextureFormats;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;

  // Test modern format support
  let webpSupported = false;
  let avifSupported = false;

  try {
    webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    // WebP not supported
  }

  try {
    avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  } catch {
    // AVIF not supported
  }

  cachedTextureFormats = {
    webp: webpSupported,
    avif: avifSupported,
    dxt: checkWebGLExtension('WEBGL_compressed_texture_s3tc'),
    etc: checkWebGLExtension('WEBGL_compressed_texture_etc'),
    astc: checkWebGLExtension('WEBGL_compressed_texture_astc'),
    png: true, // Always supported
    jpeg: true, // Always supported
  };

  return cachedTextureFormats;
}

/**
 * Get array of supported texture format names.
 * Ordered by preference (modern formats first).
 */
export function getSupportedTextureFormats(): string[] {
  if (cachedSupportedTextureFormatsArray) {
    return cachedSupportedTextureFormatsArray;
  }

  const formats = detectTextureFormats();
  const supported: string[] = [];

  // Add formats in order of preference
  if (formats.avif) supported.push('avif');
  if (formats.webp) supported.push('webp');
  if (formats.astc) supported.push('astc');
  if (formats.etc) supported.push('etc');
  if (formats.dxt) supported.push('dxt');

  // Always supported formats
  supported.push('jpeg', 'png');

  cachedSupportedTextureFormatsArray = supported;
  return supported;
}

/**
 * Detect supported audio formats.
 */
export function detectAudioFormats(): AudioFormats {
  if (cachedAudioFormats) {
    return cachedAudioFormats;
  }

  if (typeof document === 'undefined') {
    cachedAudioFormats = {
      mp3: false,
      ogg: false,
      webm: false,
      aac: false,
      wav: false,
    };
    return cachedAudioFormats;
  }

  const audio = document.createElement('audio');

  // Helper to check audio format support
  // canPlayType returns "" | "maybe" | "probably"
  function canPlayType(mimeType: string): boolean {
    const result = audio.canPlayType(mimeType);
    return result !== '';
  }

  cachedAudioFormats = {
    mp3: canPlayType('audio/mpeg;'),
    ogg: canPlayType('audio/ogg; codecs="vorbis"'),
    webm: canPlayType('audio/webm; codecs="vorbis"'),
    aac: canPlayType('audio/aac;'),
    wav: canPlayType('audio/wav; codecs="1"'),
  };

  return cachedAudioFormats;
}

/**
 * Get array of supported audio format names.
 * Ordered by preference (efficient formats first).
 */
export function getSupportedAudioFormats(): string[] {
  if (cachedSupportedAudioFormatsArray) {
    return cachedSupportedAudioFormatsArray;
  }

  const formats = detectAudioFormats();
  const supported: string[] = [];

  // Add formats in order of preference (compressed first)
  if (formats.ogg) supported.push('ogg');
  if (formats.webm) supported.push('webm');
  if (formats.mp3) supported.push('mp3');
  if (formats.aac) supported.push('aac');
  if (formats.wav) supported.push('wav');

  cachedSupportedAudioFormatsArray = supported;
  return supported;
}

/**
 * Get the best available texture format.
 */
export function getBestTextureFormat(): string {
  const formats = detectTextureFormats();

  if (formats.avif) return 'avif';
  if (formats.webp) return 'webp';
  return 'jpeg';
}

/**
 * Get the best available audio format.
 */
export function getBestAudioFormat(): string {
  const formats = detectAudioFormats();

  // Prefer compressed formats for smaller file sizes
  if (formats.ogg) return 'ogg';
  if (formats.webm) return 'webm';
  if (formats.mp3) return 'mp3';
  if (formats.aac) return 'aac';
  if (formats.wav) return 'wav';

  return 'mp3'; // Fallback
}

/**
 * Check if a specific texture format is supported.
 */
export function isTextureFormatSupported(format: string): boolean {
  const formats = detectTextureFormats();
  const normalizedFormat = format.toLowerCase();

  switch (normalizedFormat) {
    case 'webp':
      return formats.webp;
    case 'avif':
      return formats.avif;
    case 'dxt':
    case 's3tc':
      return formats.dxt;
    case 'etc':
    case 'etc1':
    case 'etc2':
      return formats.etc;
    case 'astc':
      return formats.astc;
    case 'png':
      return formats.png;
    case 'jpg':
    case 'jpeg':
      return formats.jpeg;
    default:
      return false;
  }
}

/**
 * Check if a specific audio format is supported.
 */
export function isAudioFormatSupported(format: string): boolean {
  const formats = detectAudioFormats();
  const normalizedFormat = format.toLowerCase();

  switch (normalizedFormat) {
    case 'mp3':
    case 'mpeg':
      return formats.mp3;
    case 'ogg':
    case 'vorbis':
      return formats.ogg;
    case 'webm':
      return formats.webm;
    case 'aac':
    case 'm4a':
      return formats.aac;
    case 'wav':
    case 'wave':
      return formats.wav;
    default:
      return false;
  }
}

/**
 * Detect format from file extension.
 */
export function detectFormatFromExtension(src: string): string {
  const extension = src.split('.').pop()?.toLowerCase();

  if (!extension) {
    return 'unknown';
  }

  // Normalize common extensions
  switch (extension) {
    case 'jpg':
      return 'jpeg';
    case 'm4a':
      return 'aac';
    default:
      return extension;
  }
}

/**
 * Get recommended texture format for a source URL.
 * Checks if the source format is supported, otherwise suggests alternatives.
 */
export function getRecommendedTextureFormat(src: string): string {
  const sourceFormat = detectFormatFromExtension(src);

  if (isTextureFormatSupported(sourceFormat)) {
    return sourceFormat;
  }

  // If source format is not supported, suggest the best available
  return getBestTextureFormat();
}

/**
 * Get recommended audio format for a source URL.
 * Checks if the source format is supported, otherwise suggests alternatives.
 */
export function getRecommendedAudioFormat(src: string): string {
  const sourceFormat = detectFormatFromExtension(src);

  if (isAudioFormatSupported(sourceFormat)) {
    return sourceFormat;
  }

  // If source format is not supported, suggest the best available
  return getBestAudioFormat();
}

/**
 * Clear cached format detection results.
 * Useful for testing or refreshing detection.
 */
export function clearFormatDetectionCache(): void {
  cachedTextureFormats = null;
  cachedAudioFormats = null;
  cachedSupportedTextureFormatsArray = null;
  cachedSupportedAudioFormatsArray = null;
}
