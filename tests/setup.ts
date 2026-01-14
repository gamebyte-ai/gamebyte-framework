// Test setup file for GameByte framework
// Mocks and global configuration for Jest tests

// Mock 2D Context
const mock2DContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  canvas: { width: 800, height: 600 }
};

// Mock WebGL Context
const mockWebGLContextBase = {
  getExtension: jest.fn(() => null),
  getParameter: jest.fn(() => 'Mock WebGL Renderer'),
  createShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn()
};

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn((contextType: string) => {
    if (contextType === '2d') {
      return mock2DContext;
    }
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return mockWebGLContextBase;
    }
    return null;
  }),
  width: 800,
  height: 600,
  toDataURL: jest.fn(() => 'data:image/png;base64,'),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock HTMLCanvasElement
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock Image constructor
global.Image = jest.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  width: 100,
  height: 100,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
})) as any;

// Mock Audio constructor
global.Audio = jest.fn(() => ({
  canPlayType: jest.fn(() => 'probably'),
  load: jest.fn(),
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
})) as any;

// Mock AudioContext
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1, setValueAtTime: jest.fn() }
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440, setValueAtTime: jest.fn() }
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
    loop: false
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn()
  })),
  createDynamicsCompressor: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    threshold: { value: -24, setValueAtTime: jest.fn() },
    knee: { value: 30, setValueAtTime: jest.fn() },
    ratio: { value: 12, setValueAtTime: jest.fn() },
    attack: { value: 0.003, setValueAtTime: jest.fn() },
    release: { value: 0.25, setValueAtTime: jest.fn() }
  })),
  createBiquadFilter: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    type: 'lowpass',
    frequency: { value: 350, setValueAtTime: jest.fn() },
    Q: { value: 1, setValueAtTime: jest.fn() }
  })),
  createPanner: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    setPosition: jest.fn(),
    setOrientation: jest.fn(),
    panningModel: 'HRTF',
    distanceModel: 'inverse',
    refDistance: 1,
    maxDistance: 10000,
    rolloffFactor: 1
  })),
  createStereoPanner: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    pan: { value: 0, setValueAtTime: jest.fn() }
  })),
  decodeAudioData: jest.fn(() => Promise.resolve({
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100
  })),
  destination: {
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    maxChannelCount: 2
  },
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
  suspend: jest.fn(() => Promise.resolve()),
  resume: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.AudioContext = jest.fn(() => mockAudioContext) as any;
(global as any).webkitAudioContext = jest.fn(() => mockAudioContext) as any;

// Mock WebGL support on HTMLCanvasElement prototype
HTMLCanvasElement.prototype.getContext = jest.fn(function(this: any, contextType: string) {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContextBase;
  }
  if (contextType === '2d') {
    return mock2DContext;
  }
  return null;
});

// Mock fetch API
export const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob())
  })
) as jest.Mock;

global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  writable: true
});

// Mock navigator properties
Object.defineProperty(navigator, 'deviceMemory', {
  value: 4,
  writable: true
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  value: 4,
  writable: true
});

Object.defineProperty(navigator, 'connection', {
  value: { effectiveType: '4g' },
  writable: true
});

// Mock screen properties
Object.defineProperty(screen, 'width', { value: 1920, writable: true });
Object.defineProperty(screen, 'height', { value: 1080, writable: true });

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true
});

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

// Mock IndexedDB
const mockIDBRequest = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onsuccess: null,
  onerror: null,
  result: null
};

const mockIDBDatabase = {
  close: jest.fn(),
  createObjectStore: jest.fn(() => ({
    createIndex: jest.fn()
  })),
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => mockIDBRequest),
      put: jest.fn(() => mockIDBRequest),
      delete: jest.fn(() => mockIDBRequest),
      clear: jest.fn(() => mockIDBRequest),
      openCursor: jest.fn(() => mockIDBRequest)
    }))
  }))
};

global.indexedDB = {
  open: jest.fn(() => ({
    ...mockIDBRequest,
    onupgradeneeded: null,
    result: mockIDBDatabase
  })),
  deleteDatabase: jest.fn(() => mockIDBRequest)
} as any;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // Suppress expected rejections during asset manager cleanup
  if (reason instanceof Error && reason.message === 'Asset manager destroyed') {
    return;
  }
  console.error('Unhandled Promise Rejection:', reason);
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});