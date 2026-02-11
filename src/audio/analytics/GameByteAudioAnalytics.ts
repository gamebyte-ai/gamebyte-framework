import { EventEmitter } from 'eventemitter3';
import {
  AudioAnalyticsSystem,
  AudioAnalytics,
  AudioEvents,
  AudioSource,
  AudioPerformanceMetrics,
  AudioInterruption,
  AudioQuality,
  AudioPerformanceTier
} from '../../contracts/Audio';
import { Logger } from '../../utils/Logger.js';

/**
 * Audio session data for analytics
 */
interface AudioSession {
  startTime: number;
  endTime?: number;
  duration: number;
  tracksPlayed: string[];
  soundsPlayed: number;
  averageVolume: number;
  interruptionCount: number;
  qualityChanges: number;
}

/**
 * Aggregated audio insights
 */
interface AudioInsights {
  totalSessions: number;
  averageSessionDuration: number;
  mostPlayedTracks: Array<{ track: string; playCount: number }>;
  peakUsageHours: number[];
  preferredVolumeRange: { min: number; max: number };
  interruptionRate: number;
  qualityPreferences: Map<AudioQuality, number>;
}

/**
 * GameByte Audio Analytics System
 * 
 * Features:
 * - Comprehensive playback tracking and metrics
 * - User preference learning and adaptation
 * - Performance monitoring and optimization insights
 * - Privacy-focused local data collection
 * - Exportable analytics for game optimization
 * - Real-time behavioral analysis
 */
export class GameByteAudioAnalytics extends EventEmitter<AudioEvents> implements AudioAnalyticsSystem {
  private _analytics: AudioAnalytics;
  private _sessions: AudioSession[];
  private _currentSession: AudioSession | null = null;
  private _insights: AudioInsights;
  
  // Tracking state
  private _trackPlayCounts = new Map<string, number>();
  private _hourlyUsage = new Array(24).fill(0);
  private _volumeHistory: number[] = [];
  private _qualityHistory: AudioQuality[] = [];
  private _performanceHistory: AudioPerformanceMetrics[] = [];
  
  // Analytics intervals
  private _insightsUpdateInterval: number | null = null;
  private _performanceTrackingInterval: number | null = null;
  
  // Privacy settings
  private _dataRetentionDays = 30;
  private _maxSessionsStored = 1000;

  constructor() {
    super();
    
    // Initialize analytics with default values
    this._analytics = {
      totalPlaytime: 0,
      musicVolume: 0.8,
      sfxVolume: 1.0,
      environmentalAudio: true,
      preferredQuality: AudioQuality.MEDIUM,
      interruptionEvents: 0,
      batteryOptimizationEnabled: true,
      deviceInfo: {
        audioContextSampleRate: 44100,
        maxChannelCount: 2,
        latency: 0,
        performanceTier: AudioPerformanceTier.MEDIUM
      }
    };
    
    this._sessions = [];
    this._insights = {
      totalSessions: 0,
      averageSessionDuration: 0,
      mostPlayedTracks: [],
      peakUsageHours: [],
      preferredVolumeRange: { min: 0.5, max: 1.0 },
      interruptionRate: 0,
      qualityPreferences: new Map()
    };
    
    // Load saved data
    this.loadAnalyticsData();
    
    // Start analytics tracking
    this.startAnalyticsTracking();
  }

  get analytics(): AudioAnalytics {
    return { ...this._analytics };
  }

  /**
   * Load analytics data from storage
   */
  private loadAnalyticsData(): void {
    try {
      const stored = localStorage.getItem('gamebyte-audio-analytics');
      if (stored) {
        const data = JSON.parse(stored);
        this._analytics = { ...this._analytics, ...data.analytics };
        this._sessions = data.sessions || [];
        this._trackPlayCounts = new Map(data.trackPlayCounts || []);
        this._hourlyUsage = data.hourlyUsage || new Array(24).fill(0);
        this._volumeHistory = data.volumeHistory || [];
        this._qualityHistory = data.qualityHistory || [];
        
        // Update insights
        this.updateInsights();
      }
    } catch (error) {
      Logger.warn('Audio', 'Failed to load audio analytics data:', error);
    }
  }

  /**
   * Save analytics data to storage
   */
  private saveAnalyticsData(): void {
    try {
      const data = {
        analytics: this._analytics,
        sessions: this._sessions.slice(-this._maxSessionsStored), // Keep only recent sessions
        trackPlayCounts: Array.from(this._trackPlayCounts.entries()),
        hourlyUsage: this._hourlyUsage,
        volumeHistory: this._volumeHistory.slice(-1000), // Keep last 1000 volume changes
        qualityHistory: this._qualityHistory.slice(-1000), // Keep last 1000 quality changes
        lastUpdated: Date.now()
      };
      
      localStorage.setItem('gamebyte-audio-analytics', JSON.stringify(data));
    } catch (error) {
      Logger.warn('Audio', 'Failed to save audio analytics data:', error);
    }
  }

  /**
   * Start analytics tracking intervals
   */
  private startAnalyticsTracking(): void {
    // Update insights every 5 minutes
    this._insightsUpdateInterval = window.setInterval(() => {
      this.updateInsights();
      this.saveAnalyticsData();
    }, 5 * 60 * 1000);
    
    // Clean up old data daily
    this._performanceTrackingInterval = window.setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Start a new audio session
   */
  startSession(): void {
    // End current session if exists
    if (this._currentSession) {
      this.endSession();
    }
    
    this._currentSession = {
      startTime: Date.now(),
      duration: 0,
      tracksPlayed: [],
      soundsPlayed: 0,
      averageVolume: this._analytics.musicVolume,
      interruptionCount: 0,
      qualityChanges: 0
    };
    
    // Track usage by hour
    const hour = new Date().getHours();
    this._hourlyUsage[hour]++;
  }

  /**
   * End current audio session
   */
  endSession(): void {
    if (!this._currentSession) return;
    
    this._currentSession.endTime = Date.now();
    this._currentSession.duration = this._currentSession.endTime - this._currentSession.startTime;
    
    // Update total playtime
    this._analytics.totalPlaytime += this._currentSession.duration;
    
    // Store session
    this._sessions.push(this._currentSession);
    this._currentSession = null;
    
    // Update insights
    this.updateInsights();
  }

  // Data collection methods
  trackPlayback(source: AudioSource, duration: number): void {
    if (this._currentSession) {
      this._currentSession.soundsPlayed++;
      
      // Track if this is a music track
      if (source.id.includes('music') || source.id.includes('track')) {
        if (!this._currentSession.tracksPlayed.includes(source.id)) {
          this._currentSession.tracksPlayed.push(source.id);
        }
        
        // Update track play count
        const currentCount = this._trackPlayCounts.get(source.id) || 0;
        this._trackPlayCounts.set(source.id, currentCount + 1);
      }
    }
    
    this.emit('analytics:playback-tracked', {
      sourceId: source.id,
      duration
    } as any);
  }

  trackVolumeChange(type: 'music' | 'sfx', volume: number): void {
    if (type === 'music') {
      this._analytics.musicVolume = volume;
    } else {
      this._analytics.sfxVolume = volume;
    }
    
    // Track volume history
    this._volumeHistory.push(volume);
    
    // Update current session average volume
    if (this._currentSession) {
      const totalVolume = this._currentSession.averageVolume * this._currentSession.soundsPlayed + volume;
      this._currentSession.averageVolume = totalVolume / (this._currentSession.soundsPlayed + 1);
    }
    
    this.emit('analytics:volume-tracked', {
      type,
      volume
    } as any);
  }

  trackInterruption(type: AudioInterruption): void {
    this._analytics.interruptionEvents++;
    
    if (this._currentSession) {
      this._currentSession.interruptionCount++;
    }
    
    this.emit('analytics:interruption-tracked', {
      type,
      count: this._analytics.interruptionEvents
    } as any);
  }

  trackPerformance(metrics: AudioPerformanceMetrics): void {
    // Keep recent performance history
    this._performanceHistory.push(metrics);
    if (this._performanceHistory.length > 100) {
      this._performanceHistory.shift();
    }
    
    // Update device info
    this._analytics.deviceInfo = {
      audioContextSampleRate: metrics.contextState === 'running' ? 44100 : 0,
      maxChannelCount: 2, // Would be determined from actual context
      latency: metrics.latency,
      performanceTier: this.determinePerformanceTier(metrics)
    };
  }

  /**
   * Determine performance tier from metrics
   */
  private determinePerformanceTier(metrics: AudioPerformanceMetrics): AudioPerformanceTier {
    let score = 0;
    
    // CPU usage score (lower is better)
    if (metrics.cpuUsage < 5) score += 3;
    else if (metrics.cpuUsage < 10) score += 2;
    else if (metrics.cpuUsage < 20) score += 1;
    
    // Memory usage score (lower is better)
    if (metrics.memoryUsage < 32) score += 3;
    else if (metrics.memoryUsage < 64) score += 2;
    else if (metrics.memoryUsage < 128) score += 1;
    
    // Latency score (lower is better)
    if (metrics.latency < 0.02) score += 3;
    else if (metrics.latency < 0.05) score += 2;
    else if (metrics.latency < 0.1) score += 1;
    
    // Active sources handling
    if (metrics.activeSources > 32) score += 3;
    else if (metrics.activeSources > 16) score += 2;
    else if (metrics.activeSources > 8) score += 1;
    
    // Determine tier based on score
    if (score >= 10) return AudioPerformanceTier.PREMIUM;
    if (score >= 7) return AudioPerformanceTier.HIGH;
    if (score >= 4) return AudioPerformanceTier.MEDIUM;
    return AudioPerformanceTier.LOW;
  }

  // User preferences
  updateUserPreferences(preferences: Partial<AudioAnalytics>): void {
    this._analytics = { ...this._analytics, ...preferences };
    
    // Track quality preference changes
    if (preferences.preferredQuality) {
      this._qualityHistory.push(preferences.preferredQuality);
      
      if (this._currentSession) {
        this._currentSession.qualityChanges++;
      }
    }
    
    this.saveAnalyticsData();
    
    this.emit('analytics:preferences-updated', {
      preferences
    } as any);
  }

  getUserPreferences(): AudioAnalytics {
    return this.analytics;
  }

  exportAnalytics(): string {
    const exportData = {
      analytics: this._analytics,
      insights: this._insights,
      sessions: this._sessions,
      trackPlayCounts: Object.fromEntries(this._trackPlayCounts),
      hourlyUsage: this._hourlyUsage,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Insights generation
  getPlaytimeInsights(): {
    totalTime: number;
    averageSession: number;
    preferredTimes: number[];
  } {
    const totalTime = this._analytics.totalPlaytime;
    const averageSession = this._sessions.length > 0 
      ? this._sessions.reduce((sum, session) => sum + session.duration, 0) / this._sessions.length
      : 0;
    
    // Find peak usage hours (top 3)
    const hoursWithUsage = this._hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
      .map(item => item.hour);
    
    return {
      totalTime,
      averageSession,
      preferredTimes: hoursWithUsage
    };
  }

  getPerformanceInsights(): {
    averageCPU: number;
    peakMemory: number;
    interruptionRate: number;
  } {
    const recentMetrics = this._performanceHistory.slice(-50); // Last 50 entries
    
    const averageCPU = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, metric) => sum + metric.cpuUsage, 0) / recentMetrics.length
      : 0;
    
    const peakMemory = recentMetrics.length > 0
      ? Math.max(...recentMetrics.map(metric => metric.memoryUsage))
      : 0;
    
    const interruptionRate = this._sessions.length > 0
      ? this._analytics.interruptionEvents / this._sessions.length
      : 0;
    
    return {
      averageCPU,
      peakMemory,
      interruptionRate
    };
  }

  /**
   * Update comprehensive insights
   */
  private updateInsights(): void {
    this._insights.totalSessions = this._sessions.length;
    
    // Calculate average session duration
    if (this._sessions.length > 0) {
      this._insights.averageSessionDuration = 
        this._sessions.reduce((sum, session) => sum + session.duration, 0) / this._sessions.length;
    }
    
    // Most played tracks
    this._insights.mostPlayedTracks = Array.from(this._trackPlayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([track, playCount]) => ({ track, playCount }));
    
    // Peak usage hours
    this._insights.peakUsageHours = this._hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
      .map(item => item.hour);
    
    // Preferred volume range
    if (this._volumeHistory.length > 0) {
      const sortedVolumes = [...this._volumeHistory].sort((a, b) => a - b);
      const q1Index = Math.floor(sortedVolumes.length * 0.25);
      const q3Index = Math.floor(sortedVolumes.length * 0.75);
      
      this._insights.preferredVolumeRange = {
        min: sortedVolumes[q1Index],
        max: sortedVolumes[q3Index]
      };
    }
    
    // Interruption rate
    this._insights.interruptionRate = this._sessions.length > 0
      ? this._analytics.interruptionEvents / this._sessions.length
      : 0;
    
    // Quality preferences
    const qualityCount = new Map<AudioQuality, number>();
    this._qualityHistory.forEach(quality => {
      qualityCount.set(quality, (qualityCount.get(quality) || 0) + 1);
    });
    this._insights.qualityPreferences = qualityCount;
  }

  /**
   * Clean up old data for privacy and performance
   */
  private cleanupOldData(): void {
    const cutoffDate = Date.now() - (this._dataRetentionDays * 24 * 60 * 60 * 1000);
    
    // Remove old sessions
    this._sessions = this._sessions.filter(session => session.startTime > cutoffDate);
    
    // Limit history arrays
    if (this._volumeHistory.length > 1000) {
      this._volumeHistory = this._volumeHistory.slice(-500);
    }
    
    if (this._qualityHistory.length > 1000) {
      this._qualityHistory = this._qualityHistory.slice(-500);
    }
    
    if (this._performanceHistory.length > 200) {
      this._performanceHistory = this._performanceHistory.slice(-100);
    }
  }

  /**
   * Get recommendations based on analytics
   */
  getRecommendations(): Array<{
    type: 'volume' | 'quality' | 'timing' | 'performance';
    message: string;
    confidence: number;
  }> {
    const recommendations = [];
    
    // Volume recommendations
    if (this._volumeHistory.length > 10) {
      const avgVolume = this._volumeHistory.reduce((sum, vol) => sum + vol, 0) / this._volumeHistory.length;
      if (avgVolume < 0.3) {
        recommendations.push({
          type: 'volume' as const,
          message: 'Consider increasing audio volume for better experience',
          confidence: 0.7
        });
      } else if (avgVolume > 0.9) {
        recommendations.push({
          type: 'volume' as const,
          message: 'High volume detected - consider hearing protection',
          confidence: 0.8
        });
      }
    }
    
    // Performance recommendations
    const performanceInsights = this.getPerformanceInsights();
    if (performanceInsights.averageCPU > 20) {
      recommendations.push({
        type: 'performance' as const,
        message: 'Consider reducing audio quality to improve performance',
        confidence: 0.9
      });
    }
    
    // Usage timing recommendations
    const playtimeInsights = this.getPlaytimeInsights();
    if (playtimeInsights.preferredTimes.length > 0) {
      recommendations.push({
        type: 'timing' as const,
        message: `Optimal gaming time appears to be around ${playtimeInsights.preferredTimes[0]}:00`,
        confidence: 0.6
      });
    }
    
    return recommendations;
  }

  /**
   * Get detailed analytics report
   */
  getDetailedReport(): {
    summary: AudioAnalytics;
    insights: AudioInsights;
    recommendations: Array<{
      type: string;
      message: string;
      confidence: number;
    }>;
    performanceMetrics: {
      averageCPU: number;
      peakMemory: number;
      interruptionRate: number;
    };
  } {
    return {
      summary: this.analytics,
      insights: this._insights,
      recommendations: this.getRecommendations(),
      performanceMetrics: this.getPerformanceInsights()
    };
  }

  /**
   * Reset analytics data (for privacy)
   */
  resetAnalytics(): void {
    this._analytics = {
      totalPlaytime: 0,
      musicVolume: 0.8,
      sfxVolume: 1.0,
      environmentalAudio: true,
      preferredQuality: AudioQuality.MEDIUM,
      interruptionEvents: 0,
      batteryOptimizationEnabled: true,
      deviceInfo: {
        audioContextSampleRate: 44100,
        maxChannelCount: 2,
        latency: 0,
        performanceTier: AudioPerformanceTier.MEDIUM
      }
    };
    
    this._sessions = [];
    this._trackPlayCounts.clear();
    this._hourlyUsage.fill(0);
    this._volumeHistory = [];
    this._qualityHistory = [];
    this._performanceHistory = [];
    
    // Clear storage
    localStorage.removeItem('gamebyte-audio-analytics');
    
    this.emit('analytics:reset', {} as any);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // End current session
    if (this._currentSession) {
      this.endSession();
    }
    
    // Save final data
    this.saveAnalyticsData();
    
    // Clear intervals
    if (this._insightsUpdateInterval) {
      clearInterval(this._insightsUpdateInterval);
      this._insightsUpdateInterval = null;
    }
    
    if (this._performanceTrackingInterval) {
      clearInterval(this._performanceTrackingInterval);
      this._performanceTrackingInterval = null;
    }
    
    this.removeAllListeners();
  }
}