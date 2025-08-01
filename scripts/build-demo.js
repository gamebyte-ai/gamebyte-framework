#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Demo Build Script
 * 
 * Bu script demo'yu standalone hale getirir:
 * 1. Framework'un build output'unu kopyalar
 * 2. Demo dosyalarını kopyalar
 * 3. Import path'lerini düzeltir
 * 4. eventemitter3'ü bundle'a dahil eder
 */

const sourceDir = path.join(__dirname, '../demos/core');
const distDir = path.join(__dirname, '../demos/dist');
const frameworkDistDir = path.join(__dirname, '../dist');
const nodeModulesDir = path.join(__dirname, '../node_modules');

// Dist dizinini temizle
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('🚀 Building standalone demo...');

// Framework dosyalarını kopyala (artık eventemitter3 bundle'da)
console.log('📦 Copying framework files...');
copyDirectory(frameworkDistDir, path.join(distDir, 'lib'));

// Demo dosyalarını kopyala ve import path'lerini düzelt
console.log('📝 Processing demo files...');
copyAndProcessDemoFiles(sourceDir, distDir);

console.log('✅ Demo build complete! Run: npm run demo:serve');

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.warn(`⚠️  Source directory not found: ${source}`);
    return;
  }
  
  fs.mkdirSync(destination, { recursive: true });
  
  const items = fs.readdirSync(source);
  
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function copyAndProcessDemoFiles(source, destination) {
  const items = fs.readdirSync(source);
  
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyAndProcessDemoFiles(sourcePath, destPath);
    } else if (item.endsWith('.js') || item.endsWith('.html')) {
      // JS ve HTML dosyalarını işle ve import path'lerini düzelt
      processJsFile(sourcePath, destPath);
    } else {
      // Diğer dosyaları olduğu gibi kopyala
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function processJsFile(sourcePath, destPath) {
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  // Framework import path'lerini düzelt
  content = content.replace(
    /from ['"]\.\.\/\.\.\/dist\//g,
    "from './lib/"
  );
  
  // eventemitter3 artık framework bundle'ında - framework'den import et
  content = content.replace(
    /from ['"]eventemitter3['"]/g,
    "from './lib/index.js'"
  );
  
  // HTML dosyası için özel işlemler
  const fileName = path.basename(sourcePath);
  if (fileName === 'index.html') {
    content = content.replace(
      /from ['"]\.\.\/\.\.\/dist\/index\.js['"]/g,
      "from './lib/index.js'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/dist\/facades\/Facade\.js['"]/g,
      "from './lib/facades/Facade.js'"
    );
  }
  
  fs.writeFileSync(destPath, content, 'utf8');
}