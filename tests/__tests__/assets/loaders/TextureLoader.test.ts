/**
 * @jest-environment jsdom
 */

import { TextureLoader } from '../../../../src/assets/loaders/TextureLoader';
import { AssetConfig, AssetType } from '../../../../src/contracts/AssetManager';
import { mockFetch } from '../../../setup';

// Mock Image class for more control
class MockImageWithDimensions extends Image {
  public _width: number;
  public _height: number;
  
  constructor(width = 100, height = 100) {
    super();
    this._width = width;
    this._height = height;
  }

  get width() { return this._width; }
  get height() { return this._height; }
  
  set src(value: string) {
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) {
        this.onload(new Event('load'));
      }
    }, 0);
  }
}

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url-123');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  },
  writable: true
});

describe('TextureLoader', () => {
  let loader: TextureLoader;

  beforeEach(() => {
    loader = new TextureLoader();
    jest.clearAllMocks();
    
    // Reset global Image mock
    (global as any).Image = MockImageWithDimensions;
    
    // Mock fetch response
    (mockFetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['fake-image-data'], { type: 'image/jpeg' }))
    });
  });

  afterEach(() => {
    loader.destroy();
  });

  describe('loader capabilities', () => {
    it('should support texture and sprite asset types', () => {
      // Act
      const canLoadTexture = loader.canLoad(AssetType.TEXTURE);
      const canLoadSprite = loader.canLoad(AssetType.SPRITE);
      const canLoadAudio = loader.canLoad(AssetType.AUDIO);

      // Assert
      expect(canLoadTexture).toBe(true);
      expect(canLoadSprite).toBe(true);
      expect(canLoadAudio).toBe(false);
    });

    it('should have correct supported types', () => {
      // Assert
      expect(loader.supportedTypes).toEqual([AssetType.TEXTURE, AssetType.SPRITE]);
    });
  });

  describe('basic loading', () => {
    it('should load a texture successfully', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'test-texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      const result = await loader.load(config);

      // Assert
      expect(result).toMatchObject({
        image: expect.any(MockImageWithDimensions),
        width: 256,
        height: 256,
        format: 'jpeg',
        compressed: false,
        size: expect.any(Number)
      });
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should throw error for unsupported asset types', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'test-audio',
        type: AssetType.AUDIO,
        src: '/audio/test.mp3'
      };

      // Act & Assert
      await expect(loader.load(config)).rejects.toThrow(
        'TextureLoader cannot load assets of type: audio'
      );
    });

    it('should handle fetch errors', async () => {
      // Arrange
      (mockFetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const config: AssetConfig = {
        id: 'test-texture',
        type: AssetType.TEXTURE,
        src: '/textures/missing.jpg'
      };

      // Act & Assert
      await expect(loader.load(config)).rejects.toThrow('Network error');
    });

    it('should handle image decode errors', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'test-texture',
        type: AssetType.TEXTURE,
        src: '/textures/corrupt.jpg'
      };

      class FailingImage extends MockImageWithDimensions {
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }
      }

      (global as any).Image = jest.fn(() => new FailingImage());

      // Act & Assert
      await expect(loader.load(config)).rejects.toThrow('Failed to decode image');
    });
  });

  describe('texture optimization', () => {
    it('should resize large textures for mobile', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'large-texture',
        type: AssetType.TEXTURE,
        src: '/textures/large.jpg',
        options: {
          maxSize: 512
        }
      };

      const mockLargeImage = new MockImageWithDimensions(2048, 2048);
      (global as any).Image = jest.fn(() => mockLargeImage);

      // Mock canvas operations
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: '',
          drawImage: jest.fn(),
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,fake-data')
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return {} as any;
      });

      // Act
      const result = await loader.load(config);

      // Assert
      expect(result.width).toBeLessThanOrEqual(512);
      expect(result.height).toBeLessThanOrEqual(512);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should optimize for power-of-2 textures on low DPI devices', async () => {
      // Arrange
      Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
      
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      };

      const mockImage = new MockImageWithDimensions(300, 200);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      const result = await loader.load(config);

      // Assert
      // Should be optimized to power of 2 dimensions
      expect([256, 512, 1024, 2048]).toContain(result.width);
      expect([256, 512, 1024, 2048]).toContain(result.height);
    });

    it('should respect quality settings', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg',
        options: {
          quality: 0.7
        }
      };

      const mockImage = new MockImageWithDimensions(1024, 1024);
      (global as any).Image = jest.fn(() => mockImage);

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: '',
          drawImage: jest.fn(),
        }),
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,fake-data')
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return {} as any;
      });

      // Force resize by setting small max size
      config.options!.maxSize = 512;

      // Act
      await loader.load(config);

      // Assert
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.7);
    });
  });

  describe('format detection and optimization', () => {
    it('should detect WebP support', () => {
      // Arrange - Setup mock canvas that supports WebP
      const mockCanvas = {
        toDataURL: jest.fn((type) => {
          if (type === 'image/webp') {
            return 'data:image/webp;base64,fake-webp-data';
          }
          return 'data:image/png;base64,fake-png-data';
        })
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return {} as any;
      });

      // Act
      const testLoader = new TextureLoader();

      // Assert - Constructor should detect WebP support
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp');
    });

    it('should choose optimal source based on format support', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/fallback.jpg',
        sources: {
          high: '/textures/test.avif',
          medium: '/textures/test.webp',
          low: '/textures/test.jpg'
        }
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      await loader.load(config);

      // Assert - Should use WebP source since it's supported in setup
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test.webp'),
        expect.any(Object)
      );
    });

    it('should detect image format from file extension', async () => {
      // Arrange
      const configs = [
        { src: '/test.webp', expectedFormat: 'webp' },
        { src: '/test.avif', expectedFormat: 'avif' },
        { src: '/test.png', expectedFormat: 'png' },
        { src: '/test.jpg', expectedFormat: 'jpeg' },
        { src: '/test.jpeg', expectedFormat: 'jpeg' }
      ];

      const mockImage = new MockImageWithDimensions(100, 100);
      (global as any).Image = jest.fn(() => mockImage);

      for (const { src, expectedFormat } of configs) {
        const config: AssetConfig = {
          id: 'test',
          type: AssetType.TEXTURE,
          src
        };

        // Act
        const result = await loader.load(config);

        // Assert
        expect(result.format).toBe(expectedFormat);
      }
    });
  });

  describe('device tier optimization', () => {
    it('should detect premium device tier', async () => {
      // Arrange
      Object.defineProperty(window, 'devicePixelRatio', { value: 3 });
      Object.defineProperty(window.screen, 'width', { value: 1440 });
      Object.defineProperty(window.screen, 'height', { value: 2560 });

      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg',
        sources: {
          premium: '/textures/test-4k.jpg',
          high: '/textures/test-hd.jpg',
          medium: '/textures/test-md.jpg',
          low: '/textures/test-low.jpg'
        }
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      await loader.load(config);

      // Assert - Should choose high quality source for premium device
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test-hd.jpg'),
        expect.any(Object)
      );
    });

    it('should detect low-end device tier', async () => {
      // Arrange
      Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
      Object.defineProperty(window.screen, 'width', { value: 480 });
      Object.defineProperty(window.screen, 'height', { value: 800 });

      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg',
        sources: {
          high: '/textures/test-hd.jpg',
          medium: '/textures/test-md.jpg',
          low: '/textures/test-low.jpg'
        }
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      await loader.load(config);

      // Assert - Should choose low quality source for low-end device
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test-low.jpg'),
        expect.any(Object)
      );
    });
  });

  describe('size estimation', () => {
    it('should estimate texture memory size correctly', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.png'
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      const result = await loader.load(config);

      // Assert
      // PNG with RGBA should be 256 * 256 * 4 = 262,144 bytes
      expect(result.size).toBe(262144);
    });

    it('should estimate compressed format sizes', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.webp'
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      const result = await loader.load(config);

      // Assert
      // WebP (compressed) should be 256 * 256 * 3 = 196,608 bytes
      expect(result.size).toBe(196608);
      expect(result.compressed).toBe(true);
    });
  });

  describe('event emission', () => {
    it('should emit loaded event on successful load', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      const loadedSpy = jest.fn();
      loader.on('loaded', loadedSpy);

      // Act
      const result = await loader.load(config);

      // Assert
      expect(loadedSpy).toHaveBeenCalledWith({
        assetId: 'texture',
        texture: result
      });
    });

    it('should emit failed event on load error', async () => {
      // Arrange
      (mockFetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/missing.jpg'
      };

      const failedSpy = jest.fn();
      loader.on('failed', failedSpy);

      // Act & Assert
      await expect(loader.load(config)).rejects.toThrow();
      expect(failedSpy).toHaveBeenCalledWith({
        assetId: 'texture',
        error: expect.any(Error)
      });
    });
  });

  describe('WebGL extension detection', () => {
    it('should detect supported compressed texture formats', () => {
      // Arrange - Mock WebGL context with extensions
      const mockGetExtension = jest.fn((name) => {
        const extensions = [
          'WEBGL_compressed_texture_s3tc',
          'WEBGL_compressed_texture_etc'
        ];
        return extensions.includes(name) ? {} : null;
      });

      const mockGL = {
        getExtension: mockGetExtension
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockGL)
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return {} as any;
      });

      // Act
      const testLoader = new TextureLoader();

      // Assert
      expect(mockGetExtension).toHaveBeenCalledWith('WEBGL_compressed_texture_s3tc');
      expect(mockGetExtension).toHaveBeenCalledWith('WEBGL_compressed_texture_etc');
      expect(mockGetExtension).toHaveBeenCalledWith('WEBGL_compressed_texture_astc');
    });
  });

  describe('resource cleanup', () => {
    it('should clean up canvas resources on destroy', () => {
      // Arrange
      const initialWidth = (loader as any).canvas.width;
      const initialHeight = (loader as any).canvas.height;

      // Act
      loader.destroy();

      // Assert
      expect((loader as any).canvas.width).toBe(0);
      expect((loader as any).canvas.height).toBe(0);
    });

    it('should revoke object URLs after image loading', async () => {
      // Arrange
      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      };

      const mockImage = new MockImageWithDimensions(256, 256);
      (global as any).Image = jest.fn(() => mockImage);

      // Act
      await loader.load(config);

      // Assert
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle WebGL context creation failure', () => {
      // Arrange - Mock canvas that fails to create WebGL context
      const mockCanvas = {
        getContext: jest.fn(() => null)
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return {} as any;
      });

      // Act & Assert - Should not throw when WebGL is unavailable
      expect(() => new TextureLoader()).not.toThrow();
    });

    it('should handle blob creation errors', async () => {
      // Arrange
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockRejectedValue(new Error('Blob creation failed'))
      });

      const config: AssetConfig = {
        id: 'texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      };

      // Act & Assert
      await expect(loader.load(config)).rejects.toThrow('Blob creation failed');
    });
  });
});