/**
 * PathFollower - Entity that follows a waypoint path at configurable speed.
 * Interpolates smoothly between waypoints, fires events on completion.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface Waypoint {
  x: number;
  y: number;
}

export interface PathFollowerEvents {
  'waypoint-reached': (index: number) => void;
  'path-complete': () => void;
}

export class PathFollower extends EventEmitter<PathFollowerEvents> {
  private path: Waypoint[];
  private speed: number;

  private _x: number;
  private _y: number;
  private _progress: number = 0;
  private _isComplete: boolean = false;
  private _paused: boolean = false;

  private currentWaypoint: number = 0;
  /** 0-1 progress between currentWaypoint and currentWaypoint+1 */
  private segmentProgress: number = 0;

  constructor(path: Waypoint[], speed: number = 100) {
    super();
    this.path = path;
    this.speed = speed;

    if (path.length === 0) {
      this._x = 0;
      this._y = 0;
      this._isComplete = true;
    } else {
      this._x = path[0].x;
      this._y = path[0].y;
    }
  }

  /** Call each frame. dt in seconds. Returns current position. */
  update(dt: number): { x: number; y: number } {
    if (this._isComplete || this._paused || this.path.length < 2) {
      return { x: this._x, y: this._y };
    }

    let remaining = this.speed * dt;

    while (remaining > 0 && !this._isComplete) {
      const from = this.path[this.currentWaypoint];
      const to = this.path[this.currentWaypoint + 1];

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (segmentLength === 0) {
        // Zero-length segment: skip it
        this.currentWaypoint++;
        this.segmentProgress = 0;
        this.emit('waypoint-reached', this.currentWaypoint);

        if (this.currentWaypoint >= this.path.length - 1) {
          this._isComplete = true;
          this._x = this.path[this.path.length - 1].x;
          this._y = this.path[this.path.length - 1].y;
          this.emit('path-complete');
          break;
        }
        continue;
      }

      const distanceLeft = segmentLength * (1 - this.segmentProgress);

      if (remaining >= distanceLeft) {
        // Reached next waypoint
        remaining -= distanceLeft;
        this.currentWaypoint++;
        this.segmentProgress = 0;
        this.emit('waypoint-reached', this.currentWaypoint);

        if (this.currentWaypoint >= this.path.length - 1) {
          this._isComplete = true;
          this._x = this.path[this.path.length - 1].x;
          this._y = this.path[this.path.length - 1].y;
          this._progress = 1;
          this.emit('path-complete');
          break;
        }
      } else {
        // Advance within current segment
        this.segmentProgress += remaining / segmentLength;
        remaining = 0;
      }
    }

    if (!this._isComplete && this.path.length >= 2) {
      const from = this.path[this.currentWaypoint];
      const to = this.path[Math.min(this.currentWaypoint + 1, this.path.length - 1)];
      const t = this.segmentProgress;
      this._x = from.x + (to.x - from.x) * t;
      this._y = from.y + (to.y - from.y) * t;

      // Compute total progress (0-1 across all segments)
      this._progress = (this.currentWaypoint + this.segmentProgress) / (this.path.length - 1);
    }

    return { x: this._x, y: this._y };
  }

  /** Current position */
  get x(): number { return this._x; }
  get y(): number { return this._y; }

  /** Progress along entire path (0-1) */
  get progress(): number { return this._progress; }

  /** Has reached end of path? */
  get isComplete(): boolean { return this._isComplete; }

  /** Change speed */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /** Pause movement */
  pause(): void {
    this._paused = true;
  }

  /** Resume movement */
  resume(): void {
    this._paused = false;
  }

  /** Reset to start of path */
  reset(): void {
    this.currentWaypoint = 0;
    this.segmentProgress = 0;
    this._progress = 0;
    this._isComplete = false;
    this._paused = false;

    if (this.path.length > 0) {
      this._x = this.path[0].x;
      this._y = this.path[0].y;
    }
  }
}
