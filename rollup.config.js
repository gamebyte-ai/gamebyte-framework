import { createRequire } from 'module';
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const require = createRequire(import.meta.url);

// Main bundle configuration
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    }
  ],
  external: ['pixi.js', 'three', 'matter-js', 'cannon-es'],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ]
};

// 2D Rendering Bundle (Pixi.js)
const pixi2DConfig = {
  input: 'src/renderers/pixi2d.ts',
  output: {
    dir: 'dist/renderers',
    entryFileNames: 'pixi2d.js',
    format: 'es',
    sourcemap: true
  },
  external: ['pixi.js'],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ]
};

// 3D Rendering Bundle (Three.js)
const three3DConfig = {
  input: 'src/renderers/three3d.ts',
  output: {
    dir: 'dist/renderers',
    entryFileNames: 'three3d.js',
    format: 'es',
    sourcemap: true
  },
  external: ['three'],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ]
};

// 2D Physics Bundle (Matter.js)
const matter2DConfig = {
  input: 'src/physics/matter2d.ts',
  output: {
    dir: 'dist/physics', 
    entryFileNames: 'matter2d.js',
    format: 'es',
    sourcemap: true
  },
  external: ['matter-js'],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ]
};

// 3D Physics Bundle (Cannon-ES)
const cannon3DConfig = {
  input: 'src/physics/cannon3d.ts',
  output: {
    dir: 'dist/physics',
    entryFileNames: 'cannon3d.js', 
    format: 'es',
    sourcemap: true
  },
  external: ['cannon-es'],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ]
};

export default [
  mainConfig,
  pixi2DConfig,
  three3DConfig,
  matter2DConfig,
  cannon3DConfig
];