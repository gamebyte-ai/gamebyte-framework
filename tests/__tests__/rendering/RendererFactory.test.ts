/**
 * @jest-environment jsdom
 */

import { RendererFactory } from '../../../src/rendering/RendererFactory';
import { RenderingMode } from '../../../src/contracts/Renderer';

// Mock the renderer implementations
jest.mock('../../../src/rendering/PixiRenderer', () => ({
  PixiRenderer: jest.fn().mockImplementation(() => ({
    mode: RenderingMode.RENDERER_2D,
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn()
  }))
}));

jest.mock('../../../src/rendering/ThreeRenderer', () => ({
  ThreeRenderer: jest.fn().mockImplementation(() => ({
    mode: RenderingMode.RENDERER_3D,
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn()
  }))
}));

import { PixiRenderer } from '../../../src/rendering/PixiRenderer';
import { ThreeRenderer } from '../../../src/rendering/ThreeRenderer';

describe('RendererFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Restore original mock implementations to prevent test pollution
    (PixiRenderer as jest.Mock).mockImplementation(() => ({
      mode: RenderingMode.RENDERER_2D,
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn()
    }));

    (ThreeRenderer as jest.Mock).mockImplementation(() => ({
      mode: RenderingMode.RENDERER_3D,
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn()
    }));
  });

  describe('renderer creation', () => {
    it('should create PixiRenderer for RENDERER_2D mode', () => {
      // Act
      const renderer = RendererFactory.create(RenderingMode.RENDERER_2D);

      // Assert
      expect(PixiRenderer).toHaveBeenCalledTimes(1);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D);
      expect(renderer.initialize).toBeDefined();
      expect(renderer.start).toBeDefined();
    });

    it('should create ThreeRenderer for RENDERER_3D mode', () => {
      // Act
      const renderer = RendererFactory.create(RenderingMode.RENDERER_3D);

      // Assert
      expect(ThreeRenderer).toHaveBeenCalledTimes(1);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_3D);
      expect(renderer.initialize).toBeDefined();
      expect(renderer.start).toBeDefined();
    });

    it('should create PixiRenderer for HYBRID mode (default implementation)', () => {
      // Act
      const renderer = RendererFactory.create(RenderingMode.HYBRID);

      // Assert
      expect(PixiRenderer).toHaveBeenCalledTimes(1);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D);
    });

    it('should fallback to 2D renderer for unsupported rendering mode', () => {
      // Arrange
      const unsupportedMode = 'UNSUPPORTED_MODE' as RenderingMode;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const renderer = RendererFactory.create(unsupportedMode);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unsupported rendering mode: UNSUPPORTED_MODE. Falling back to 2D renderer.'
      );
      expect(PixiRenderer).toHaveBeenCalled();
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('supported modes', () => {
    it('should return all supported rendering modes', () => {
      // Act
      const supportedModes = RendererFactory.getSupportedModes();

      // Assert
      expect(supportedModes).toEqual([
        RenderingMode.RENDERER_2D,
        RenderingMode.RENDERER_3D,
        RenderingMode.HYBRID
      ]);
    });

    it('should check if mode is supported', () => {
      // Act & Assert
      expect(RendererFactory.isSupported(RenderingMode.RENDERER_2D)).toBe(true);
      expect(RendererFactory.isSupported(RenderingMode.RENDERER_3D)).toBe(true);
      expect(RendererFactory.isSupported(RenderingMode.HYBRID)).toBe(true);
      expect(RendererFactory.isSupported('INVALID' as RenderingMode)).toBe(false);
    });
  });

  describe('best mode detection', () => {
    it('should default to RENDERER_2D regardless of device type', () => {
      // Arrange - Test both mobile and desktop user agents
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15', // Mobile
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' // Desktop
      ];

      // Mock WebGL support
      const mockGetContext = jest.fn().mockReturnValue({
        getExtension: jest.fn().mockReturnValue({
          UNMASKED_RENDERER_WEBGL: 37446
        }),
        getParameter: jest.fn().mockReturnValue('Mock GPU')
      });

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      for (const userAgent of userAgents) {
        // Arrange
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: userAgent
        });

        // Act
        const bestMode = RendererFactory.detectBestMode();

        // Assert - Both mobile and desktop should default to 2D
        expect(bestMode).toBe(RenderingMode.RENDERER_2D);
      }
    });

    it('should fallback to RENDERER_2D when WebGL is not supported', () => {
      // Arrange
      const mockGetContext = jest.fn().mockReturnValue(null);
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      const bestMode = RendererFactory.detectBestMode();

      // Assert
      expect(bestMode).toBe(RenderingMode.RENDERER_2D);
      expect(consoleInfoSpy).toHaveBeenCalledWith('WebGL not supported, defaulting to 2D renderer');
      
      consoleInfoSpy.mockRestore();
    });

    it('should handle WebGL context creation errors', () => {
      // Arrange
      const mockGetContext = jest.fn().mockImplementation(() => {
        throw new Error('WebGL not available');
      });

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      const bestMode = RendererFactory.detectBestMode();

      // Assert
      expect(bestMode).toBe(RenderingMode.RENDERER_2D);
    });
  });

  describe('WebGL detection', () => {
    it('should check both webgl and experimental-webgl contexts', () => {
      // Arrange
      const mockGetContext = jest.fn()
        .mockReturnValueOnce(null) // First call (webgl) fails
        .mockReturnValueOnce({ // Second call (experimental-webgl) succeeds
          getExtension: jest.fn(),
          getParameter: jest.fn()
        });

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      RendererFactory.detectBestMode();

      // Assert
      expect(mockGetContext).toHaveBeenCalledWith('webgl');
      expect(mockGetContext).toHaveBeenCalledWith('experimental-webgl');
    });

    it('should handle debug renderer info extension', () => {
      // Arrange
      const mockDebugExtension = {
        UNMASKED_RENDERER_WEBGL: 37446,
        UNMASKED_VENDOR_WEBGL: 37445
      };

      const mockGL = {
        getExtension: jest.fn().mockImplementation((name) => {
          return name === 'WEBGL_debug_renderer_info' ? mockDebugExtension : null;
        }),
        getParameter: jest.fn().mockImplementation((param) => {
          if (param === 37446) return 'Mock GPU Renderer';
          if (param === 37445) return 'Mock GPU Vendor';
          return null;
        })
      };

      const mockGetContext = jest.fn().mockReturnValue(mockGL);

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      RendererFactory.detectBestMode();

      // Assert
      expect(mockGL.getExtension).toHaveBeenCalledWith('WEBGL_debug_renderer_info');
      expect(mockGL.getParameter).toHaveBeenCalledWith(37446);
    });
  });

  describe('error handling', () => {
    it('should handle renderer creation errors gracefully', () => {
      // Arrange
      (PixiRenderer as jest.Mock).mockImplementation(() => {
        throw new Error('Renderer creation failed');
      });

      // Act & Assert
      expect(() => RendererFactory.create(RenderingMode.RENDERER_2D)).toThrow('Renderer creation failed');
    });

    it('should handle canvas creation errors in detection', () => {
      // Arrange
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Canvas creation failed');
      });

      // Act
      const bestMode = RendererFactory.detectBestMode();

      // Assert - Should fallback gracefully
      expect(bestMode).toBe(RenderingMode.RENDERER_2D);
    });
  });

  describe('createWithFallback', () => {
    it('should create requested renderer when supported', () => {
      // Arrange
      const mockGetContext = jest.fn().mockReturnValue({
        getExtension: jest.fn(),
        getParameter: jest.fn()
      });

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      const renderer = RendererFactory.createWithFallback(RenderingMode.RENDERER_3D);

      // Assert
      expect(ThreeRenderer).toHaveBeenCalledTimes(1);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_3D);
    });

    it('should fallback to 2D when 3D is not supported', () => {
      // Arrange
      const mockGetContext = jest.fn().mockReturnValue(null);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      const renderer = RendererFactory.createWithFallback(RenderingMode.RENDERER_3D);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith('WebGL not supported, falling back to 2D renderer');
      expect(PixiRenderer).toHaveBeenCalled();
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D);

      consoleWarnSpy.mockRestore();
    });

    it('should use custom fallback when provided', () => {
      // Arrange
      const mockGetContext = jest.fn().mockReturnValue(null);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      jest.spyOn(document, 'createElement').mockImplementation(() => ({
        getContext: mockGetContext
      } as any));

      // Act
      const renderer = RendererFactory.createWithFallback(RenderingMode.RENDERER_3D, RenderingMode.HYBRID);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith('WebGL not supported, falling back to 2D renderer');
      expect(PixiRenderer).toHaveBeenCalled();
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D); // Falls back to 2D

      consoleWarnSpy.mockRestore();
    });

    it('should handle renderer creation errors', () => {
      // Arrange
      (ThreeRenderer as jest.Mock).mockImplementation(() => {
        throw new Error('Renderer creation failed');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const renderer = RendererFactory.createWithFallback(RenderingMode.RENDERER_3D, RenderingMode.RENDERER_2D);

      // Assert
      // When ThreeRenderer creation fails, it checks WebGL which also fails, so we get WebGL warning
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(PixiRenderer).toHaveBeenCalled();
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('factory immutability', () => {
    it('should create new instances on each call', () => {
      // Act
      const renderer1 = RendererFactory.create(RenderingMode.RENDERER_2D);
      const renderer2 = RendererFactory.create(RenderingMode.RENDERER_2D);

      // Assert
      expect(PixiRenderer).toHaveBeenCalledTimes(2);
      expect(renderer1).not.toBe(renderer2);
    });

    it('should not maintain state between calls', () => {
      // Act
      const supportedModes1 = RendererFactory.getSupportedModes();
      const supportedModes2 = RendererFactory.getSupportedModes();

      // Assert
      expect(supportedModes1).toEqual(supportedModes2);
      expect(supportedModes1).not.toBe(supportedModes2); // Different array instances
    });
  });
});