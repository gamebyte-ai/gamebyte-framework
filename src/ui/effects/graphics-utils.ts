import { IGraphicsFactory } from '../../contracts/Graphics.js';
import { GraphicsEngine } from '../../graphics/GraphicsEngine.js';

/**
 * Get graphics factory - requires GraphicsEngine to be initialized
 * Shared utility for all UI effects
 */
export function getGraphicsFactory(): IGraphicsFactory {
  if (!GraphicsEngine.isInitialized()) {
    throw new Error('GraphicsEngine not initialized. Call game.initialize() first.');
  }
  return GraphicsEngine.getFactory();
}
