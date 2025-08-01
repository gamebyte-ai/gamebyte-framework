# Installation

This guide will help you install GameByte Framework and set up your development environment.

## System Requirements

### Minimum Requirements
- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher (or yarn 1.22.0+)
- **TypeScript**: 4.5.0 or higher (automatically installed)
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Recommended Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **TypeScript**: 5.0.0 or higher
- **Code Editor**: Visual Studio Code with TypeScript support

### Browser Support
GameByte Framework supports modern browsers with WebGL capabilities:
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

## Installation Methods

### Method 1: Create New Project (Recommended)

The easiest way to get started is using our project generator:

```bash
# Create a new GameByte project
npx create-gamebyte-app my-game

# Navigate to project directory
cd my-game

# Install dependencies
npm install

# Start development server
npm run dev
```

This will create a complete project structure with:
- TypeScript configuration
- Build tools (Rollup/Webpack)
- Development server
- Example game code
- Testing setup

### Method 2: Add to Existing Project

If you want to add GameByte Framework to an existing project:

```bash
# Install the framework
npm install @gamebyte/framework

# Install peer dependencies
npm install pixi.js three matter-js cannon-es

# Install TypeScript types (if using TypeScript)
npm install -D @types/three @types/matter-js
```

### Method 3: Use Framework Template

Clone our official template repository:

```bash
# Clone the template
git clone https://github.com/gamebyte/framework-template my-game
cd my-game

# Install dependencies
npm install

# Start development
npm run dev
```

## Package Dependencies

GameByte Framework has several peer dependencies that need to be installed:

### Core Dependencies
```json
{
  "dependencies": {
    "@gamebyte/framework": "^1.0.0",
    "pixi.js": "^7.0.0",
    "three": "^0.150.0",
    "matter-js": "^0.19.0",
    "cannon-es": "^0.20.0"
  }
}
```

### TypeScript Types (for TypeScript projects)
```json
{
  "devDependencies": {
    "@types/three": "^0.160.0",
    "@types/matter-js": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```

## Project Setup

### Basic HTML Setup

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My GameByte Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        
        #game-canvas {
            display: block;
            border: 1px solid #333;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            #game-canvas {
                width: 100vw;
                height: 100vh;
            }
        }
    </style>
</head>
<body>
    <canvas id="game-canvas"></canvas>
    <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

### TypeScript Configuration

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@gamebyte/*": ["node_modules/@gamebyte/*"]
    }
  },
  "include": [
    "src/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
```

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "serve": "vite preview",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src/**/*.{ts,tsx}"
  }
}
```

## Development Tools

### Recommended VS Code Extensions

Install these extensions for the best development experience:

1. **TypeScript Importer** - Auto import management
2. **ESLint** - Code linting
3. **Prettier** - Code formatting
4. **GameByte Snippets** - Framework-specific code snippets
5. **WebGL Shader** - Shader syntax highlighting
6. **Auto Rename Tag** - HTML tag management

### Build Tools Setup

#### Option 1: Vite (Recommended)

Install Vite for fast development:

```bash
npm install -D vite @vitejs/plugin-typescript
```

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import typescript from '@vitejs/plugin-typescript';

export default defineConfig({
  plugins: [typescript()],
  server: {
    port: 3000,
    host: true, // Allow access from network
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'three': ['three'],
          'physics': ['matter-js', 'cannon-es']
        }
      }
    }
  }
});
```

#### Option 2: Webpack

Install Webpack dependencies:

```bash
npm install -D webpack webpack-cli webpack-dev-server 
npm install -D typescript ts-loader html-webpack-plugin
```

Create `webpack.config.js`:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    })
  ],
  devServer: {
    static: './dist',
    port: 3000,
    hot: true
  }
};
```

## Verification

### Test Installation

Create a simple test file `src/main.ts`:

```typescript
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';

async function main() {
  console.log('GameByte Framework loaded successfully!');
  
  // Create game instance
  const app = createGame();
  
  // Initialize facades
  initializeFacades(app);
  
  // Get canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  try {
    // Initialize with 2D rendering
    await app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb
    });
    
    // Start the game loop
    app.start();
    
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

main();
```

### Run the Test

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# You should see a blue canvas
```

## Common Installation Issues

### Node.js Version Issues

If you encounter Node.js version errors:

```bash
# Check your Node.js version
node --version

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### Peer Dependency Warnings

If you see peer dependency warnings:

```bash
# Install all peer dependencies explicitly
npm install pixi.js three matter-js cannon-es

# Or use --legacy-peer-deps flag
npm install --legacy-peer-deps
```

### TypeScript Errors

If you encounter TypeScript compilation errors:

```bash
# Clear TypeScript cache
npx tsc --build --clean

# Reinstall TypeScript
npm uninstall typescript
npm install -D typescript@latest
```

### WebGL Context Issues

If you encounter WebGL context errors:

1. Ensure your browser supports WebGL 2.0
2. Update your graphics drivers
3. Try running with different browsers
4. Check for hardware acceleration settings

### Mobile Testing Setup

For mobile development, set up local network access:

```bash
# Find your local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from mobile device
# http://YOUR_LOCAL_IP:3000
```

## Next Steps

Now that you have GameByte Framework installed:

1. **Continue to [Quick Start Guide](./quickstart.md)** - Create your first game
2. **Read [Project Structure](./project-structure.md)** - Understand the recommended layout
3. **Follow [First Game Tutorial](./first-game.md)** - Build a complete game
4. **Explore [Core Concepts](../core-concepts/architecture.md)** - Learn the framework architecture

## Getting Help

If you encounter any installation issues:

- Check our [Troubleshooting Guide](../troubleshooting/common-issues.md)
- Visit our [GitHub Discussions](https://github.com/gamebyte/framework/discussions)
- Join our [Discord Community](https://discord.gg/gamebyte)
- Review [Common Issues](../troubleshooting/common-issues.md)

---

**Ready to create games?** Continue to the [Quick Start Guide](./quickstart.md) to build your first GameByte game!