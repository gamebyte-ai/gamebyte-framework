import { EventEmitter } from 'eventemitter3';
import { 
  RenderingOptimizer as IRenderingOptimizer, 
  BatchRenderingConfig, 
  LODLevel, 
  RenderStats,
  QualityLevel 
} from '../contracts/Performance';

/**
 * Batch render group for optimized rendering
 */
interface BatchGroup {
  texture: any;
  shader: string;
  objects: RenderableObject[];
  vertices: Float32Array;
  indices: Uint16Array;
  dirty: boolean;
}

/**
 * Renderable object interface
 */
interface RenderableObject {
  id: string;
  position: { x: number; y: number; z?: number };
  scale: { x: number; y: number };
  rotation: number;
  texture: any;
  shader: string;
  visible: boolean;
  bounds: { 
    min: { x: number; y: number; z?: number };
    max: { x: number; y: number; z?: number };
  };
  lodLevel: number;
  distanceFromCamera: number;
}

/**
 * Camera interface for culling
 */
interface Camera {
  position: { x: number; y: number; z?: number };
  rotation: { x: number; y: number; z: number };
  fov?: number;
  near: number;
  far: number;
  viewMatrix?: Float32Array;
  projectionMatrix?: Float32Array;
  frustum?: Frustum;
}

/**
 * Frustum for culling calculations
 */
interface Frustum {
  planes: Array<{ normal: { x: number; y: number; z: number }; distance: number }>;
}

/**
 * Advanced rendering optimizer with batching and culling
 */
export class RenderingOptimizer extends EventEmitter implements IRenderingOptimizer {
  private config: BatchRenderingConfig;
  private isInitialized = false;
  
  // Batch rendering
  private batchGroups = new Map<string, BatchGroup>();
  private renderQueue: RenderableObject[] = [];
  private maxBatchSize = 1000;
  private batchingEnabled = true;
  
  // Culling systems
  private frustumCullingEnabled = true;
  private occlusionCullingEnabled = false;
  private distanceCullingEnabled = true;
  private maxRenderDistance = 1000;
  
  // LOD system
  private lodLevels: LODLevel[] = [];
  private lodEnabled = true;
  
  // Render statistics
  private renderStats: RenderStats = {
    drawCalls: 0,
    triangles: 0,
    visibleObjects: 0,
    culledObjects: 0,
    batchedObjects: 0,
    textureSwaps: 0,
    shaderSwaps: 0
  };
  
  // Performance tracking
  private frameRenderTime = 0;
  private lastFrameStats: RenderStats = { ...this.renderStats };
  private renderTimeHistory: number[] = [];
  
  // Texture atlas for batching
  private textureAtlas = new Map<string, { x: number; y: number; width: number; height: number }>();
  private atlasTexture: any = null;
  
  // Occlusion culling
  private occlusionQueries = new Map<string, any>();
  private occlusionResults = new Map<string, boolean>();

  constructor() {
    super();
    
    this.config = {
      maxBatchSize: 1000,
      sortingEnabled: true,
      textureAtlasing: true,
      instancedRendering: false,
      frustumCulling: true,
      occlusionCulling: false,
      distanceCulling: true,
      maxDistance: 1000
    };
    
    // Initialize default LOD levels
    this.lodLevels = [
      { distance: 0, quality: QualityLevel.ULTRA_HIGH, enabled: true },
      { distance: 100, quality: QualityLevel.HIGH, enabled: true },
      { distance: 300, quality: QualityLevel.MEDIUM, enabled: true },
      { distance: 600, quality: QualityLevel.LOW, enabled: true },
      { distance: 1000, quality: QualityLevel.ULTRA_LOW, enabled: true }
    ];
  }

  /**
   * Initialize the rendering optimizer
   */
  initialize(config: Partial<BatchRenderingConfig> = {}): void {
    this.config = { ...this.config, ...config };
    this.maxBatchSize = this.config.maxBatchSize;
    this.frustumCullingEnabled = this.config.frustumCulling;
    this.occlusionCullingEnabled = this.config.occlusionCulling;
    this.distanceCullingEnabled = this.config.distanceCulling;
    this.maxRenderDistance = this.config.maxDistance;
    
    this.resetStats();
    this.isInitialized = true;
    
    this.emit('initialized', this.config);
  }

  /**
   * Enable batch rendering
   */
  enableBatching(): void {
    this.batchingEnabled = true;
    this.emit('batching-enabled');
  }

  /**
   * Disable batch rendering
   */
  disableBatching(): void {
    this.batchingEnabled = false;
    this.clearBatches();
    this.emit('batching-disabled');
  }

  /**
   * Enable culling systems
   */
  enableCulling(): void {
    this.frustumCullingEnabled = true;
    this.distanceCullingEnabled = true;
    this.emit('culling-enabled');
  }

  /**
   * Disable culling systems
   */
  disableCulling(): void {
    this.frustumCullingEnabled = false;
    this.distanceCullingEnabled = false;
    this.occlusionCullingEnabled = false;
    this.emit('culling-disabled');
  }

  /**
   * Set LOD levels configuration
   */
  setLODLevels(levels: LODLevel[]): void {
    this.lodLevels = [...levels].sort((a, b) => a.distance - b.distance);
    this.emit('lod-levels-updated', this.lodLevels);
  }

  /**
   * Update culling calculations
   */
  updateCulling(camera: Camera): void {
    if (!this.isInitialized) return;
    
    const startTime = performance.now();
    
    // Update camera frustum if needed
    if (this.frustumCullingEnabled && !camera.frustum) {
      camera.frustum = this.calculateFrustum(camera);
    }
    
    // Reset culling stats
    this.renderStats.visibleObjects = 0;
    this.renderStats.culledObjects = 0;
    
    // Process render queue
    for (const obj of this.renderQueue) {
      obj.distanceFromCamera = this.calculateDistance(camera.position, obj.position);
      
      let visible = obj.visible;
      
      // Distance culling
      if (visible && this.distanceCullingEnabled) {
        visible = obj.distanceFromCamera <= this.maxRenderDistance;
      }
      
      // Frustum culling
      if (visible && this.frustumCullingEnabled && camera.frustum) {
        visible = this.isInFrustum(obj, camera.frustum);
      }
      
      // Occlusion culling
      if (visible && this.occlusionCullingEnabled) {
        visible = !this.isOccluded(obj, camera);
      }
      
      // LOD calculation
      if (visible && this.lodEnabled) {
        obj.lodLevel = this.calculateLOD(obj.distanceFromCamera);
        
        // Skip if LOD level is disabled
        const lodConfig = this.lodLevels.find(l => l.quality === obj.lodLevel);
        if (lodConfig && !lodConfig.enabled) {
          visible = false;
        }
      }
      
      if (visible) {
        this.renderStats.visibleObjects++;
      } else {
        this.renderStats.culledObjects++;
      }
      
      obj.visible = visible;
    }
    
    const cullingTime = performance.now() - startTime;
    this.emit('culling-updated', {
      time: cullingTime,
      visible: this.renderStats.visibleObjects,
      culled: this.renderStats.culledObjects
    });
  }

  /**
   * Calculate camera frustum planes
   */
  private calculateFrustum(camera: Camera): Frustum {
    const frustum: Frustum = { planes: [] };
    
    // Simplified frustum calculation
    // In a real implementation, this would use proper matrix math
    const fov = camera.fov || 75;
    const aspect = 16 / 9; // Default aspect ratio
    
    // Calculate frustum planes (simplified)
    const halfFov = (fov * Math.PI / 180) / 2;
    const nearHeight = 2 * Math.tan(halfFov) * camera.near;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan(halfFov) * camera.far;
    const farWidth = farHeight * aspect;
    
    // Create six frustum planes
    frustum.planes = [
      { normal: { x: 0, y: 0, z: 1 }, distance: -camera.near }, // Near
      { normal: { x: 0, y: 0, z: -1 }, distance: camera.far },  // Far
      { normal: { x: 1, y: 0, z: 0 }, distance: nearWidth / 2 }, // Left
      { normal: { x: -1, y: 0, z: 0 }, distance: nearWidth / 2 }, // Right
      { normal: { x: 0, y: 1, z: 0 }, distance: nearHeight / 2 }, // Bottom
      { normal: { x: 0, y: -1, z: 0 }, distance: nearHeight / 2 } // Top
    ];
    
    return frustum;
  }

  /**
   * Check if object is within camera frustum
   */
  private isInFrustum(obj: RenderableObject, frustum: Frustum): boolean {
    // Simplified frustum culling - check object bounds against frustum planes
    for (const plane of frustum.planes) {
      const distance = 
        plane.normal.x * obj.position.x +
        plane.normal.y * obj.position.y +
        plane.normal.z * (obj.position.z || 0) -
        plane.distance;
      
      // If object is completely outside any plane, it's culled
      if (distance < -10) { // Add small buffer
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if object is occluded
   */
  private isOccluded(obj: RenderableObject, camera: Camera): boolean {
    // Simplified occlusion culling
    // In a real implementation, this would use occlusion queries or spatial data structures
    
    const result = this.occlusionResults.get(obj.id);
    return result !== undefined ? result : false;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = (pos2.z || 0) - (pos1.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate LOD level based on distance
   */
  private calculateLOD(distance: number): number {
    for (let i = this.lodLevels.length - 1; i >= 0; i--) {
      if (distance >= this.lodLevels[i].distance) {
        return this.lodLevels[i].quality;
      }
    }
    
    return QualityLevel.ULTRA_HIGH;
  }

  /**
   * Add object to render queue
   */
  addToRenderQueue(obj: RenderableObject): void {
    this.renderQueue.push(obj);
    
    if (this.batchingEnabled) {
      this.addToBatch(obj);
    }
  }

  /**
   * Remove object from render queue
   */
  removeFromRenderQueue(objId: string): void {
    const index = this.renderQueue.findIndex(obj => obj.id === objId);
    if (index !== -1) {
      const obj = this.renderQueue[index];
      this.renderQueue.splice(index, 1);
      
      if (this.batchingEnabled) {
        this.removeFromBatch(obj);
      }
    }
  }

  /**
   * Add object to appropriate batch group
   */
  private addToBatch(obj: RenderableObject): void {
    const batchKey = this.getBatchKey(obj);
    
    let batch = this.batchGroups.get(batchKey);
    if (!batch) {
      batch = this.createBatchGroup(obj);
      this.batchGroups.set(batchKey, batch);
    }
    
    batch.objects.push(obj);
    batch.dirty = true;
    
    // Split batch if it gets too large
    if (batch.objects.length > this.maxBatchSize) {
      this.splitBatch(batchKey, batch);
    }
  }

  /**
   * Remove object from batch group
   */
  private removeFromBatch(obj: RenderableObject): void {
    const batchKey = this.getBatchKey(obj);
    const batch = this.batchGroups.get(batchKey);
    
    if (batch) {
      const index = batch.objects.findIndex(o => o.id === obj.id);
      if (index !== -1) {
        batch.objects.splice(index, 1);
        batch.dirty = true;
        
        // Remove empty batch
        if (batch.objects.length === 0) {
          this.batchGroups.delete(batchKey);
        }
      }
    }
  }

  /**
   * Generate batch key for grouping objects
   */
  private getBatchKey(obj: RenderableObject): string {
    // Group by texture and shader
    const textureId = obj.texture ? obj.texture.id || 'default' : 'default';
    return `${textureId}_${obj.shader}`;
  }

  /**
   * Create new batch group
   */
  private createBatchGroup(obj: RenderableObject): BatchGroup {
    return {
      texture: obj.texture,
      shader: obj.shader,
      objects: [],
      vertices: new Float32Array(this.maxBatchSize * 16), // 4 vertices * 4 components
      indices: new Uint16Array(this.maxBatchSize * 6), // 2 triangles * 3 indices
      dirty: true
    };
  }

  /**
   * Split large batch into smaller ones
   */
  private splitBatch(batchKey: string, batch: BatchGroup): void {
    const midPoint = Math.floor(batch.objects.length / 2);
    const secondHalf = batch.objects.splice(midPoint);
    
    // Create new batch for second half
    const newBatch = this.createBatchGroup(batch.objects[0]);
    newBatch.objects = secondHalf;
    
    const newKey = `${batchKey}_${Date.now()}`;
    this.batchGroups.set(newKey, newBatch);
    
    batch.dirty = true;
    newBatch.dirty = true;
  }

  /**
   * Update batch geometry
   */
  private updateBatchGeometry(batch: BatchGroup): void {
    if (!batch.dirty) return;
    
    let vertexIndex = 0;
    let indexIndex = 0;
    let quadIndex = 0;
    
    for (const obj of batch.objects) {
      if (!obj.visible) continue;
      
      // Generate quad vertices for object
      const quad = this.generateQuadVertices(obj);
      
      // Copy vertices
      batch.vertices.set(quad.vertices, vertexIndex);
      
      // Generate indices for quad
      const baseIndex = quadIndex * 4;
      batch.indices[indexIndex++] = baseIndex;
      batch.indices[indexIndex++] = baseIndex + 1;
      batch.indices[indexIndex++] = baseIndex + 2;
      batch.indices[indexIndex++] = baseIndex;
      batch.indices[indexIndex++] = baseIndex + 2;
      batch.indices[indexIndex++] = baseIndex + 3;
      
      vertexIndex += quad.vertices.length;
      quadIndex++;
    }
    
    batch.dirty = false;
  }

  /**
   * Generate quad vertices for object
   */
  private generateQuadVertices(obj: RenderableObject): { vertices: Float32Array } {
    const { position, scale, rotation } = obj;
    const halfWidth = scale.x / 2;
    const halfHeight = scale.y / 2;
    
    // Simple quad vertices (position, UV)
    const vertices = new Float32Array([
      // Top-left
      position.x - halfWidth, position.y + halfHeight, 0, 1,
      // Top-right
      position.x + halfWidth, position.y + halfHeight, 1, 1,
      // Bottom-right
      position.x + halfWidth, position.y - halfHeight, 1, 0,
      // Bottom-left
      position.x - halfWidth, position.y - halfHeight, 0, 0
    ]);
    
    // Apply rotation if needed
    if (rotation !== 0) {
      this.applyRotation(vertices, position, rotation);
    }
    
    return { vertices };
  }

  /**
   * Apply rotation to vertices
   */
  private applyRotation(vertices: Float32Array, center: any, rotation: number): void {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    for (let i = 0; i < vertices.length; i += 4) {
      const x = vertices[i] - center.x;
      const y = vertices[i + 1] - center.y;
      
      vertices[i] = x * cos - y * sin + center.x;
      vertices[i + 1] = x * sin + y * cos + center.y;
    }
  }

  /**
   * Render all batches
   */
  renderBatches(): void {
    const startTime = performance.now();
    
    this.resetStats();
    
    if (this.config.sortingEnabled) {
      this.sortBatches();
    }
    
    let lastTexture: any = null;
    let lastShader: string = '';
    
    for (const [batchKey, batch] of this.batchGroups) {
      if (batch.objects.length === 0) continue;
      
      // Update batch geometry if dirty
      this.updateBatchGeometry(batch);
      
      // Count texture/shader swaps
      if (batch.texture !== lastTexture) {
        this.renderStats.textureSwaps++;
        lastTexture = batch.texture;
      }
      
      if (batch.shader !== lastShader) {
        this.renderStats.shaderSwaps++;
        lastShader = batch.shader;
      }
      
      // Render batch (this would call actual rendering API)
      this.renderBatch(batch);
      
      this.renderStats.drawCalls++;
      this.renderStats.batchedObjects += batch.objects.filter(obj => obj.visible).length;
      this.renderStats.triangles += batch.objects.filter(obj => obj.visible).length * 2;
    }
    
    this.frameRenderTime = performance.now() - startTime;
    this.updateRenderTimeHistory();
    
    this.emit('render-completed', {
      time: this.frameRenderTime,
      stats: { ...this.renderStats }
    });
  }

  /**
   * Sort batches for optimal rendering
   */
  private sortBatches(): void {
    // Sort by shader first, then by texture to minimize state changes
    const sortedEntries = Array.from(this.batchGroups.entries()).sort((a, b) => {
      const [keyA, batchA] = a;
      const [keyB, batchB] = b;
      
      if (batchA.shader !== batchB.shader) {
        return batchA.shader.localeCompare(batchB.shader);
      }
      
      const textureIdA = batchA.texture?.id || '';
      const textureIdB = batchB.texture?.id || '';
      return textureIdA.localeCompare(textureIdB);
    });
    
    // Rebuild map with sorted order
    this.batchGroups.clear();
    for (const [key, batch] of sortedEntries) {
      this.batchGroups.set(key, batch);
    }
  }

  /**
   * Render individual batch (stub - would interface with actual renderer)
   */
  private renderBatch(batch: BatchGroup): void {
    // This would interface with the actual rendering system
    // For now, just emit an event
    this.emit('batch-rendered', {
      objectCount: batch.objects.filter(obj => obj.visible).length,
      textureId: batch.texture?.id,
      shader: batch.shader
    });
  }

  /**
   * Clear all batches
   */
  private clearBatches(): void {
    this.batchGroups.clear();
    this.emit('batches-cleared');
  }

  /**
   * Reset render statistics
   */
  private resetStats(): void {
    this.lastFrameStats = { ...this.renderStats };
    
    this.renderStats = {
      drawCalls: 0,
      triangles: 0,
      visibleObjects: 0,
      culledObjects: 0,
      batchedObjects: 0,
      textureSwaps: 0,
      shaderSwaps: 0
    };
  }

  /**
   * Update render time history
   */
  private updateRenderTimeHistory(): void {
    this.renderTimeHistory.push(this.frameRenderTime);
    
    // Limit history size
    if (this.renderTimeHistory.length > 120) {
      this.renderTimeHistory.shift();
    }
  }

  /**
   * Get render statistics
   */
  getRenderStats(): RenderStats {
    return { ...this.renderStats };
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): any {
    const avgRenderTime = this.renderTimeHistory.length > 0 
      ? this.renderTimeHistory.reduce((sum, time) => sum + time, 0) / this.renderTimeHistory.length
      : 0;
    
    return {
      currentFrame: {
        renderTime: this.frameRenderTime,
        stats: { ...this.renderStats }
      },
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      batching: {
        enabled: this.batchingEnabled,
        batchCount: this.batchGroups.size,
        maxBatchSize: this.maxBatchSize,
        totalObjects: this.renderQueue.length
      },
      culling: {
        frustumEnabled: this.frustumCullingEnabled,
        distanceEnabled: this.distanceCullingEnabled,
        occlusionEnabled: this.occlusionCullingEnabled,
        maxDistance: this.maxRenderDistance
      },
      lod: {
        enabled: this.lodEnabled,
        levels: this.lodLevels.length
      },
      efficiency: {
        cullingRatio: this.renderStats.culledObjects / (this.renderStats.visibleObjects + this.renderStats.culledObjects),
        batchingRatio: this.renderStats.batchedObjects / Math.max(1, this.renderStats.visibleObjects),
        averageObjectsPerBatch: this.batchGroups.size > 0 
          ? this.renderStats.batchedObjects / this.batchGroups.size 
          : 0
      }
    };
  }

  /**
   * Set optimization settings
   */
  setOptimizationSettings(settings: Partial<{
    batchingEnabled: boolean;
    frustumCulling: boolean;
    distanceCulling: boolean;
    occlusionCulling: boolean;
    lodEnabled: boolean;
    maxRenderDistance: number;
    maxBatchSize: number;
  }>): void {
    if (settings.batchingEnabled !== undefined) {
      if (settings.batchingEnabled) {
        this.enableBatching();
      } else {
        this.disableBatching();
      }
    }
    
    if (settings.frustumCulling !== undefined) {
      this.frustumCullingEnabled = settings.frustumCulling;
    }
    
    if (settings.distanceCulling !== undefined) {
      this.distanceCullingEnabled = settings.distanceCulling;
    }
    
    if (settings.occlusionCulling !== undefined) {
      this.occlusionCullingEnabled = settings.occlusionCulling;
    }
    
    if (settings.lodEnabled !== undefined) {
      this.lodEnabled = settings.lodEnabled;
    }
    
    if (settings.maxRenderDistance !== undefined) {
      this.maxRenderDistance = settings.maxRenderDistance;
    }
    
    if (settings.maxBatchSize !== undefined) {
      this.maxBatchSize = settings.maxBatchSize;
    }
    
    this.emit('settings-updated', settings);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearBatches();
    this.renderQueue.length = 0;
    this.renderTimeHistory.length = 0;
    this.occlusionQueries.clear();
    this.occlusionResults.clear();
    this.textureAtlas.clear();
    
    this.removeAllListeners();
    this.isInitialized = false;
  }
}