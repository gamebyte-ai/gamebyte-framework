import { createRequire } from 'module';
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const require = createRequire(import.meta.url);

// Common external dependencies
const externalDeps = [
  'pixi.js',
  '@pixi/layout',
  '@pixi/ui',
  'three',
  'matter-js',
  'cannon-es',
  'eventemitter3',
  // Three.js examples/jsm modules
  /^three\/examples\/jsm\//
];

// Common plugins
const createPlugins = (clean = true) => [
  nodeResolve({
    preferBuiltins: false,
    browser: true
  }),
  commonjs(),
  typescript({
    typescript: require('typescript'),
    clean,
    tsconfigOverride: {
      compilerOptions: {
        declaration: true,
        declarationDir: 'dist'
      }
    }
  })
];

/**
 * ESM Build - Tree-shakeable with preserved module structure
 * This is the primary build for bundlers (Vite, Webpack, etc.)
 * Module structure is preserved for optimal tree-shaking
 */
const esmConfig = {
  input: {
    // Main entry point
    'index': 'src/index.ts',
    // Core module
    'core/index': 'src/core/index.ts',
    // Rendering module
    'rendering/index': 'src/rendering/index.ts',
    // Graphics module
    'graphics/index': 'src/graphics/index.ts',
    // Scenes module
    'scenes/index': 'src/scenes/index.ts',
    // UI modules
    'ui/index': 'src/ui/index.ts',
    'ui/components/index': 'src/ui/components/index.ts',
    'ui/screens/index': 'src/ui/screens/index.ts',
    'ui/panels/index': 'src/ui/panels/index.ts',
    'ui/effects/index': 'src/ui/effects/index.ts',
    'ui/themes/index': 'src/ui/themes/index.ts',
    // Audio module
    'audio/index': 'src/audio/index.ts',
    // Input module
    'input/index': 'src/input/index.ts',
    // Physics module
    'physics/index': 'src/physics/index.ts',
    // Utils module
    'utils/index': 'src/utils/index.ts',
    // Performance module
    'performance/index': 'src/performance/index.ts',
    // Layout module
    'layout/index': 'src/layout/index.ts',
    // Facades module
    'facades/index': 'src/facades/index.ts',
    // Contracts module
    'contracts/index': 'src/contracts/index.ts',
    // Merge module
    'merge/index': 'src/merge/index.ts',
    // Three.js toolkit (separate for 3D games)
    'three/index': 'src/three/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    exports: 'named',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js'
  },
  external: externalDeps,
  plugins: createPlugins(true)
};

/**
 * CJS Build - Single bundled file for CommonJS environments
 * Backwards compatibility for older Node.js environments
 */
const cjsConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.cjs.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    inlineDynamicImports: true
  },
  external: externalDeps,
  plugins: createPlugins(false)
};

/**
 * 2D Rendering Bundle (Pixi.js) - Standalone
 */
const pixi2DConfig = {
  input: 'src/renderers/pixi2d.ts',
  output: {
    dir: 'dist/renderers',
    entryFileNames: 'pixi2d.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  external: ['pixi.js', '@pixi/layout', '@pixi/ui', /^three\/examples\/jsm\//],
  plugins: createPlugins(false)
};

/**
 * 3D Rendering Bundle (Three.js) - Standalone
 */
const three3DConfig = {
  input: 'src/renderers/three3d.ts',
  output: {
    dir: 'dist/renderers',
    entryFileNames: 'three3d.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  external: ['three', /^three\/examples\/jsm\//],
  plugins: createPlugins(false)
};

/**
 * 2D Physics Bundle (Matter.js) - Standalone
 */
const matter2DConfig = {
  input: 'src/physics/matter2d.ts',
  output: {
    dir: 'dist/physics',
    entryFileNames: 'matter2d.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  external: ['matter-js', /^three\/examples\/jsm\//],
  plugins: createPlugins(false)
};

/**
 * 3D Physics Bundle (Cannon-ES) - Standalone
 */
const cannon3DConfig = {
  input: 'src/physics/cannon3d.ts',
  output: {
    dir: 'dist/physics',
    entryFileNames: 'cannon3d.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  external: ['cannon-es', /^three\/examples\/jsm\//],
  plugins: createPlugins(false)
};

export default [
  esmConfig,
  cjsConfig,
  pixi2DConfig,
  three3DConfig,
  matter2DConfig,
  cannon3DConfig
];
