import { EventEmitter } from 'eventemitter3';
import { 
  PerformanceDebugOverlay as IPerformanceDebugOverlay,
  PerformanceMetrics,
  PerformanceProfiler as IPerformanceProfiler,
  ProfilingResult
} from '../contracts/Performance';

/**
 * Graph configuration for overlay
 */
interface GraphConfig {
  name: string;
  maxValue: number;
  color: string;
  unit: string;
  values: number[];
  maxPoints: number;
}

/**
 * Debug panel configuration
 */
interface DebugPanel {
  name: string;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: HTMLElement;
}

/**
 * Performance profiler implementation
 */
class PerformanceProfiler extends EventEmitter implements IPerformanceProfiler {
  private sessions = new Map<string, { startTime: number; calls: number; totalTime: number; minTime: number; maxTime: number }>();
  private marks = new Map<string, number>();
  private results: ProfilingResult[] = [];

  /**
   * Start profiling a named section
   */
  startProfiling(name: string): void {
    const startTime = performance.now();
    
    if (!this.sessions.has(name)) {
      this.sessions.set(name, {
        startTime,
        calls: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    } else {
      this.sessions.get(name)!.startTime = startTime;
    }
  }

  /**
   * End profiling a named section
   */
  endProfiling(name: string): number {
    const endTime = performance.now();
    const session = this.sessions.get(name);
    
    if (!session) {
      console.warn(`No profiling session found for: ${name}`);
      return 0;
    }
    
    const duration = endTime - session.startTime;
    session.calls++;
    session.totalTime += duration;
    session.minTime = Math.min(session.minTime, duration);
    session.maxTime = Math.max(session.maxTime, duration);
    
    // Add to results
    const result: ProfilingResult = {
      name,
      duration,
      startTime: session.startTime,
      endTime,
      calls: session.calls,
      averageDuration: session.totalTime / session.calls,
      minDuration: session.minTime,
      maxDuration: session.maxTime
    };
    
    this.results.push(result);
    
    // Limit results array size
    if (this.results.length > 1000) {
      this.results.shift();
    }
    
    this.emit('profiling-completed', result);
    return duration;
  }

  /**
   * Create a performance mark
   */
  mark(name: string): void {
    const time = performance.now();
    this.marks.set(name, time);
    
    // Use browser performance API if available
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);
    
    if (startTime === undefined || endTime === undefined) {
      console.warn(`Marks not found: ${startMark}, ${endMark}`);
      return 0;
    }
    
    const duration = endTime - startTime;
    
    // Use browser performance API if available
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        // Fallback to manual calculation
      }
    }
    
    this.emit('measurement-completed', { name, duration, startMark, endMark });
    return duration;
  }

  /**
   * Get all profiling results
   */
  getProfilingResults(): ProfilingResult[] {
    return [...this.results];
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results.length = 0;
    this.sessions.clear();
    this.marks.clear();
    
    // Clear browser performance entries if available
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
    
    this.emit('results-cleared');
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    const data = {
      timestamp: Date.now(),
      results: this.results,
      sessions: Object.fromEntries(this.sessions),
      marks: Object.fromEntries(this.marks)
    };
    
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Performance debugging overlay with real-time metrics and graphs
 */
export class PerformanceDebugOverlay extends EventEmitter implements IPerformanceDebugOverlay {
  private _isVisible = false;
  private container: HTMLElement | null = null;
  private graphs = new Map<string, GraphConfig>();
  private panels = new Map<string, DebugPanel>();
  private profiler: PerformanceProfiler;
  
  // Position and size
  private position = { x: 10, y: 10 };
  private size = { width: 320, height: 400 };
  
  // Update interval
  private updateInterval: number | null = null;
  private updateRate = 500; // 2 updates per second
  
  // Metrics display
  private currentMetrics: PerformanceMetrics | null = null;
  private metricsElement: HTMLElement | null = null;
  private graphsElement: HTMLElement | null = null;
  private profileElement: HTMLElement | null = null;
  
  // Styling
  private isDarkTheme = true;

  constructor() {
    super();
    this.profiler = new PerformanceProfiler();
    this.setupProfilerListeners();
  }

  /**
   * Setup profiler event listeners
   */
  private setupProfilerListeners(): void {
    this.profiler.on('profiling-completed', (result: ProfilingResult) => {
      this.updateProfileDisplay();
    });
  }

  /**
   * Show the overlay
   */
  show(): void {
    if (this._isVisible) return;
    
    this.createOverlay();
    this.startUpdates();
    this._isVisible = true;
    
    this.emit('shown');
  }

  /**
   * Hide the overlay
   */
  hide(): void {
    if (!this._isVisible) return;
    
    this.destroyOverlay();
    this.stopUpdates();
    this._isVisible = false;
    
    this.emit('hidden');
  }

  /**
   * Toggle overlay visibility
   */
  toggle(): void {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if overlay is visible
   */
  isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Update metrics display
   */
  updateMetrics(metrics: PerformanceMetrics): void {
    this.currentMetrics = metrics;
    
    if (this._isVisible && this.metricsElement) {
      this.updateMetricsDisplay();
      this.updateGraphs(metrics);
    }
  }

  /**
   * Add a graph to the overlay
   */
  addGraph(name: string, maxValue: number, color: string, unit = ''): void {
    const graph: GraphConfig = {
      name,
      maxValue,
      color,
      unit,
      values: [],
      maxPoints: 100
    };
    
    this.graphs.set(name, graph);
    
    if (this._isVisible) {
      this.createGraphElement(graph);
    }
    
    this.emit('graph-added', name);
  }

  /**
   * Remove a graph from the overlay
   */
  removeGraph(name: string): void {
    this.graphs.delete(name);
    
    if (this._isVisible && this.graphsElement) {
      const graphElement = this.graphsElement.querySelector(`[data-graph="${name}"]`);
      if (graphElement) {
        graphElement.remove();
      }
    }
    
    this.emit('graph-removed', name);
  }

  /**
   * Set overlay position
   */
  setPosition(x: number, y: number): void {
    this.position = { x, y };
    
    if (this.container) {
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
    }
  }

  /**
   * Set overlay size
   */
  setSize(width: number, height: number): void {
    this.size = { width, height };
    
    if (this.container) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }
  }

  /**
   * Create the overlay DOM structure
   */
  private createOverlay(): void {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'performance-debug-overlay';
    this.applyContainerStyles();
    
    // Create header
    const header = this.createHeader();
    this.container.appendChild(header);
    
    // Create tabs
    const tabs = this.createTabs();
    this.container.appendChild(tabs);
    
    // Create metrics panel
    this.metricsElement = this.createMetricsPanel();
    this.container.appendChild(this.metricsElement);
    
    // Create graphs panel
    this.graphsElement = this.createGraphsPanel();
    this.container.appendChild(this.graphsElement);
    
    // Create profiler panel
    this.profileElement = this.createProfilerPanel();
    this.container.appendChild(this.profileElement);
    
    // Add default graphs
    this.addDefaultGraphs();
    
    // Add to DOM
    document.body.appendChild(this.container);
    
    // Make draggable
    this.makeDraggable();
  }

  /**
   * Apply container styles
   */
  private applyContainerStyles(): void {
    if (!this.container) return;
    
    const styles = `
      position: fixed;
      left: ${this.position.x}px;
      top: ${this.position.y}px;
      width: ${this.size.width}px;
      height: ${this.size.height}px;
      background: ${this.isDarkTheme ? '#1a1a1a' : '#ffffff'};
      border: 1px solid ${this.isDarkTheme ? '#333' : '#ccc'};
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: ${this.isDarkTheme ? '#ffffff' : '#000000'};
      z-index: 9999;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    `;
    
    this.container.style.cssText = styles;
  }

  /**
   * Create header with title and controls
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: ${this.isDarkTheme ? '#2a2a2a' : '#f0f0f0'};
      border-bottom: 1px solid ${this.isDarkTheme ? '#333' : '#ccc'};
      cursor: move;
      user-select: none;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Performance Monitor';
    title.style.fontWeight = 'bold';
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    
    // Theme toggle
    const themeButton = document.createElement('button');
    themeButton.textContent = this.isDarkTheme ? '☀️' : '🌙';
    themeButton.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 14px;';
    themeButton.onclick = () => this.toggleTheme();
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = 'background: none; border: none; cursor: pointer; color: #ff4444; font-weight: bold;';
    closeButton.onclick = () => this.hide();
    
    controls.appendChild(themeButton);
    controls.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    return header;
  }

  /**
   * Create tab navigation
   */
  private createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      background: ${this.isDarkTheme ? '#333' : '#e0e0e0'};
      border-bottom: 1px solid ${this.isDarkTheme ? '#444' : '#ccc'};
    `;
    
    const tabNames = ['Metrics', 'Graphs', 'Profiler'];
    
    tabNames.forEach((name, index) => {
      const tab = document.createElement('button');
      tab.textContent = name;
      tab.style.cssText = `
        flex: 1;
        padding: 8px;
        background: ${index === 0 ? (this.isDarkTheme ? '#444' : '#fff') : 'transparent'};
        border: none;
        color: ${this.isDarkTheme ? '#fff' : '#000'};
        cursor: pointer;
        border-bottom: 2px solid ${index === 0 ? '#4CAF50' : 'transparent'};
      `;
      
      tab.onclick = () => this.switchTab(name.toLowerCase());
      tabs.appendChild(tab);
    });
    
    return tabs;
  }

  /**
   * Create metrics display panel
   */
  private createMetricsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'metrics-panel';
    panel.style.cssText = `
      padding: 12px;
      overflow-y: auto;
      height: calc(100% - 120px);
      display: block;
    `;
    
    return panel;
  }

  /**
   * Create graphs display panel
   */
  private createGraphsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'graphs-panel';
    panel.style.cssText = `
      padding: 12px;
      overflow-y: auto;
      height: calc(100% - 120px);
      display: none;
    `;
    
    return panel;
  }

  /**
   * Create profiler panel
   */
  private createProfilerPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'profiler-panel';
    panel.style.cssText = `
      padding: 12px;
      overflow-y: auto;
      height: calc(100% - 120px);
      display: none;
    `;
    
    return panel;
  }

  /**
   * Add default graphs
   */
  private addDefaultGraphs(): void {
    this.addGraph('FPS', 120, '#4CAF50', 'fps');
    this.addGraph('Frame Time', 50, '#FF9800', 'ms');
    this.addGraph('Memory', 100, '#F44336', '%');
    this.addGraph('Draw Calls', 200, '#2196F3', 'calls');
  }

  /**
   * Update metrics display
   */
  private updateMetricsDisplay(): void {
    if (!this.metricsElement || !this.currentMetrics) return;
    
    const metrics = this.currentMetrics;
    
    const html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
        <div><strong>Frame Rate</strong></div>
        <div></div>
        
        <div>Current FPS:</div>
        <div style="color: ${metrics.fps < 45 ? '#ff4444' : metrics.fps < 55 ? '#ffaa00' : '#44ff44'};">
          ${metrics.fps.toFixed(1)}
        </div>
        
        <div>Average FPS:</div>
        <div>${metrics.averageFps.toFixed(1)}</div>
        
        <div>Frame Time:</div>
        <div>${metrics.frameTime.toFixed(2)}ms</div>
        
        <div>Variance:</div>
        <div>${metrics.frameTimeVariance.toFixed(2)}ms</div>
        
        <div><strong>Memory</strong></div>
        <div></div>
        
        <div>Used:</div>
        <div style="color: ${metrics.memoryUsage.percentage > 80 ? '#ff4444' : '#44ff44'};">
          ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB (${metrics.memoryUsage.percentage.toFixed(1)}%)
        </div>
        
        <div>JS Heap:</div>
        <div>${(metrics.memoryUsage.jsHeapSizeUsed / 1024 / 1024).toFixed(1)}MB</div>
        
        <div><strong>Rendering</strong></div>
        <div></div>
        
        <div>Draw Calls:</div>
        <div style="color: ${metrics.drawCalls > 100 ? '#ff4444' : '#44ff44'};">
          ${metrics.drawCalls}
        </div>
        
        <div>Triangles:</div>
        <div>${metrics.triangles.toLocaleString()}</div>
        
        <div>Batches:</div>
        <div>${metrics.batchCount}</div>
        
        <div><strong>System</strong></div>
        <div></div>
        
        <div>CPU Usage:</div>
        <div>${metrics.cpuUsage}%</div>
        
        <div>GPU Usage:</div>
        <div>${metrics.gpuUsage}%</div>
        
        <div>Thermal State:</div>
        <div style="color: ${metrics.thermalState === 'normal' ? '#44ff44' : metrics.thermalState === 'critical' ? '#ff4444' : '#ffaa00'};">
          ${metrics.thermalState}
        </div>
      </div>
      
      ${metrics.warnings.length > 0 ? `
        <div style="margin-top: 12px; padding: 8px; background: #ff444420; border-radius: 4px;">
          <strong>Warnings (${metrics.warnings.length})</strong>
          ${metrics.warnings.slice(-3).map(w => `
            <div style="font-size: 10px; margin-top: 4px; color: #ff6666;">
              ${w.type}: ${w.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    this.metricsElement.innerHTML = html;
  }

  /**
   * Update graphs with new data
   */
  private updateGraphs(metrics: PerformanceMetrics): void {
    // Update FPS graph
    this.updateGraph('FPS', metrics.fps);
    
    // Update Frame Time graph
    this.updateGraph('Frame Time', metrics.frameTime);
    
    // Update Memory graph
    this.updateGraph('Memory', metrics.memoryUsage.percentage);
    
    // Update Draw Calls graph
    this.updateGraph('Draw Calls', metrics.drawCalls);
  }

  /**
   * Update individual graph
   */
  private updateGraph(name: string, value: number): void {
    const graph = this.graphs.get(name);
    if (!graph) return;
    
    graph.values.push(value);
    
    // Limit values array size
    if (graph.values.length > graph.maxPoints) {
      graph.values.shift();
    }
    
    // Update graph display
    this.renderGraph(graph);
  }

  /**
   * Create graph element
   */
  private createGraphElement(graph: GraphConfig): void {
    if (!this.graphsElement) return;
    
    const graphContainer = document.createElement('div');
    graphContainer.setAttribute('data-graph', graph.name);
    graphContainer.style.cssText = `
      margin-bottom: 16px;
      padding: 8px;
      border: 1px solid ${this.isDarkTheme ? '#444' : '#ccc'};
      border-radius: 4px;
    `;
    
    const title = document.createElement('div');
    title.textContent = `${graph.name} (${graph.unit})`;
    title.style.cssText = 'font-weight: bold; margin-bottom: 4px; font-size: 11px;';
    
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    canvas.style.cssText = 'width: 100%; height: 60px; display: block;';
    
    graphContainer.appendChild(title);
    graphContainer.appendChild(canvas);
    
    this.graphsElement.appendChild(graphContainer);
  }

  /**
   * Render graph data to canvas
   */
  private renderGraph(graph: GraphConfig): void {
    if (!this.graphsElement) return;
    
    const graphElement = this.graphsElement.querySelector(`[data-graph="${graph.name}"]`);
    if (!graphElement) return;
    
    const canvas = graphElement.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = this.isDarkTheme ? '#1a1a1a' : '#f8f8f8';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = this.isDarkTheme ? '#333' : '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw values
    if (graph.values.length > 1) {
      ctx.strokeStyle = graph.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const pointWidth = width / (graph.maxPoints - 1);
      
      graph.values.forEach((value, index) => {
        const x = index * pointWidth;
        const y = height - (value / graph.maxValue) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw current value
      const currentValue = graph.values[graph.values.length - 1];
      const title = graphElement.querySelector('div') as HTMLElement;
      if (title) {
        title.textContent = `${graph.name}: ${currentValue.toFixed(1)} ${graph.unit}`;
      }
    }
  }

  /**
   * Update profiler display
   */
  private updateProfileDisplay(): void {
    if (!this.profileElement) return;
    
    const results = this.profiler.getProfilingResults();
    const sessionMap = new Map<string, ProfilingResult[]>();
    
    // Group results by name
    results.forEach(result => {
      if (!sessionMap.has(result.name)) {
        sessionMap.set(result.name, []);
      }
      sessionMap.get(result.name)!.push(result);
    });
    
    let html = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <strong>Profiling Sessions</strong>
        <button onclick="this.parentElement.parentElement.clearProfiler()" 
                style="background: #ff4444; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;">
          Clear
        </button>
      </div>
    `;
    
    if (sessionMap.size === 0) {
      html += '<div style="color: #888; font-style: italic;">No profiling data available</div>';
    } else {
      sessionMap.forEach((sessionResults, name) => {
        const latest = sessionResults[sessionResults.length - 1];
        html += `
          <div style="margin-bottom: 8px; padding: 6px; background: ${this.isDarkTheme ? '#2a2a2a' : '#f0f0f0'}; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 11px;">${name}</div>
            <div style="font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>Calls: ${latest.calls}</div>
              <div>Avg: ${latest.averageDuration.toFixed(2)}ms</div>
              <div>Min: ${latest.minDuration.toFixed(2)}ms</div>
              <div>Max: ${latest.maxDuration.toFixed(2)}ms</div>
            </div>
          </div>
        `;
      });
    }
    
    this.profileElement.innerHTML = html;
    
    // Add clear function to element
    (this.profileElement as any).clearProfiler = () => {
      this.profiler.clearResults();
      this.updateProfileDisplay();
    };
  }

  /**
   * Switch between tabs
   */
  private switchTab(tabName: string): void {
    // Hide all panels
    if (this.metricsElement) this.metricsElement.style.display = 'none';
    if (this.graphsElement) this.graphsElement.style.display = 'none';
    if (this.profileElement) this.profileElement.style.display = 'none';
    
    // Show selected panel
    switch (tabName) {
      case 'metrics':
        if (this.metricsElement) this.metricsElement.style.display = 'block';
        break;
      case 'graphs':
        if (this.graphsElement) this.graphsElement.style.display = 'block';
        break;
      case 'profiler':
        if (this.profileElement) this.profileElement.style.display = 'block';
        break;
    }
    
    // Update tab styles
    if (this.container) {
      const tabs = this.container.querySelectorAll('button');
      tabs.forEach((tab, index) => {
        const isActive = (index === 1 && tabName === 'metrics') ||
                        (index === 2 && tabName === 'graphs') ||
                        (index === 3 && tabName === 'profiler');
        
        tab.style.background = isActive ? (this.isDarkTheme ? '#444' : '#fff') : 'transparent';
        tab.style.borderBottom = `2px solid ${isActive ? '#4CAF50' : 'transparent'}`;
      });
    }
  }

  /**
   * Toggle theme
   */
  private toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (this._isVisible) {
      this.hide();
      this.show();
    }
  }

  /**
   * Make overlay draggable
   */
  private makeDraggable(): void {
    if (!this.container) return;
    
    const header = this.container.querySelector('div') as HTMLElement;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffset.x = e.clientX - this.position.x;
      dragOffset.y = e.clientY - this.position.y;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      this.setPosition(newX, newY);
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * Start update interval
   */
  private startUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      if (this.currentMetrics) {
        this.updateMetricsDisplay();
        this.updateGraphs(this.currentMetrics);
      }
    }, this.updateRate);
  }

  /**
   * Stop update interval
   */
  private stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Destroy overlay DOM
   */
  private destroyOverlay(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.metricsElement = null;
    this.graphsElement = null;
    this.profileElement = null;
  }

  /**
   * Get profiler instance
   */
  getProfiler(): IPerformanceProfiler {
    return this.profiler;
  }

  /**
   * Set update rate
   */
  setUpdateRate(rateMs: number): void {
    this.updateRate = Math.max(100, rateMs); // Minimum 100ms
    
    if (this.updateInterval) {
      this.stopUpdates();
      this.startUpdates();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.hide();
    this.profiler.removeAllListeners();
    this.graphs.clear();
    this.panels.clear();
    this.removeAllListeners();
  }
}

// Export profiler separately for direct use
export { PerformanceProfiler };