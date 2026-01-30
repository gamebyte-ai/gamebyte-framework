import { createRequire } from 'module';
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const require = createRequire(import.meta.url);

// UMD bundle configuration for browser globals
// Note: @pixi/layout cannot be bundled into UMD due to its use of dynamic imports
// Demos that need layout must use ESM modules
const umdConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/gamebyte.umd.js',
    format: 'umd',
    name: 'GameByteFramework',
    globals: {
      'pixi.js': 'PIXI',
      '@pixi/layout': 'PIXI',
      'three': 'THREE',
      'matter-js': 'Matter',
      'cannon-es': 'CANNON',
      'three/examples/jsm/renderers/CSS2DRenderer.js': 'THREE'
    },
    sourcemap: true,
    exports: 'named'
  },
  external: [
    'pixi.js',
    '@pixi/layout',
    'three',
    'matter-js',
    'cannon-es',
    // Three.js examples/jsm modules
    /^three\/examples\/jsm\//
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false // Skip declaration files for UMD
        }
      }
    })
  ]
};

export default umdConfig;