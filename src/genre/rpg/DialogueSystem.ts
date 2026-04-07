/**
 * DialogueSystem - Branching dialogue tree.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface DialogueNode {
  id: string;
  text: string;
  speaker?: string;
  choices?: Array<{ text: string; next: string; condition?: () => boolean }>;
  next?: string;
  onEnter?: () => void;
}

export interface DialogueEvents {
  'node': (node: DialogueNode) => void;
  'choice-made': (choiceIndex: number, nextId: string) => void;
  'end': () => void;
}

export class DialogueSystem extends EventEmitter<DialogueEvents> {
  private _nodes: Map<string, DialogueNode>;
  private _current: DialogueNode | null;
  private _active: boolean;

  constructor(nodes: DialogueNode[]) {
    super();
    this._nodes = new Map();
    this._current = null;
    this._active = false;

    for (const node of nodes) {
      this._nodes.set(node.id, node);
    }
  }

  /** Start dialogue from a specific node (defaults to first node) */
  start(nodeId?: string): void {
    const id = nodeId ?? [...this._nodes.keys()][0];
    const node = this._nodes.get(id);
    if (!node) return;

    this._active = true;
    this._enterNode(node);
  }

  /** Choose an option for the current node (nodes with choices) */
  choose(index: number): void {
    if (!this._current || !this._current.choices) return;

    const available = this._current.choices.filter(
      c => !c.condition || c.condition()
    );

    const choice = available[index];
    if (!choice) return;

    this.emit('choice-made', index, choice.next);
    this._goTo(choice.next);
  }

  /** Advance to next node for linear nodes (no choices) */
  advance(): void {
    if (!this._current || this._current.choices) return;

    if (this._current.next) {
      this._goTo(this._current.next);
    } else {
      this._end();
    }
  }

  /** Current active node */
  get current(): DialogueNode | null {
    return this._current;
  }

  /** Is dialogue currently active? */
  get isActive(): boolean {
    return this._active;
  }

  private _goTo(nodeId: string): void {
    const node = this._nodes.get(nodeId);
    if (!node) {
      this._end();
      return;
    }
    this._enterNode(node);
  }

  private _enterNode(node: DialogueNode): void {
    this._current = node;
    if (node.onEnter) node.onEnter();
    this.emit('node', node);
  }

  private _end(): void {
    this._active = false;
    this._current = null;
    this.emit('end');
  }
}
