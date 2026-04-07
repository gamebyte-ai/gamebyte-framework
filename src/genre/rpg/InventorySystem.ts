/**
 * InventorySystem - Slot-based inventory with equip/unequip support.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface ItemDef {
  id: string;
  name: string;
  type: string;
  rarity?: string;
  stackable?: boolean;
  maxStack?: number;
  stats?: Record<string, number>;
  [key: string]: unknown;
}

export interface InventorySlot {
  item: ItemDef;
  count: number;
}

export interface InventoryEvents {
  'item-added': (item: ItemDef, count: number) => void;
  'item-removed': (item: ItemDef, count: number) => void;
  'item-equipped': (slot: string, item: ItemDef) => void;
  'item-unequipped': (slot: string, item: ItemDef) => void;
}

interface InventoryConfig {
  maxSlots?: number;
  equipSlots?: string[];
}

export class InventorySystem extends EventEmitter<InventoryEvents> {
  private _slots: InventorySlot[];
  private _equipped: Map<string, ItemDef>;
  private _maxSlots: number;
  private _equipSlots: string[];

  constructor(config: InventoryConfig = {}) {
    super();
    this._slots = [];
    this._equipped = new Map();
    this._maxSlots = config.maxSlots ?? 50;
    this._equipSlots = config.equipSlots ?? ['weapon', 'armor', 'accessory'];
  }

  /** Add item to inventory. Returns false if inventory is full. */
  add(item: ItemDef, count = 1): boolean {
    if (item.stackable) {
      const existing = this._slots.find(s => s.item.id === item.id);
      if (existing) {
        const max = item.maxStack ?? Infinity;
        const space = max - existing.count;
        const toAdd = Math.min(count, space);
        if (toAdd > 0) {
          existing.count += toAdd;
          this.emit('item-added', item, toAdd);
        }
        // If we added less than requested, discard overflow (or could loop)
        return true;
      }
    }

    if (this._slots.length >= this._maxSlots) return false;

    this._slots.push({ item, count });
    this.emit('item-added', item, count);
    return true;
  }

  /** Remove item by id. Returns false if not found or insufficient count. */
  remove(itemId: string, count = 1): boolean {
    const idx = this._slots.findIndex(s => s.item.id === itemId);
    if (idx === -1) return false;

    const slot = this._slots[idx];
    if (slot.count < count) return false;

    slot.count -= count;
    this.emit('item-removed', slot.item, count);

    if (slot.count <= 0) {
      this._slots.splice(idx, 1);
    }
    return true;
  }

  /** Check if inventory contains at least 1 of an item */
  has(itemId: string): boolean {
    return this._slots.some(s => s.item.id === itemId);
  }

  /** Get total count of an item in inventory */
  getCount(itemId: string): number {
    return this._slots
      .filter(s => s.item.id === itemId)
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Equip item to a named slot. Returns false if item not in inventory. */
  equip(slot: string, itemId: string): boolean {
    const invSlot = this._slots.find(s => s.item.id === itemId);
    if (!invSlot) return false;

    // Unequip existing item in that slot first
    if (this._equipped.has(slot)) {
      this.unequip(slot);
    }

    this._equipped.set(slot, invSlot.item);
    this.emit('item-equipped', slot, invSlot.item);
    return true;
  }

  /** Unequip from slot. Returns the removed item or null. */
  unequip(slot: string): ItemDef | null {
    const item = this._equipped.get(slot);
    if (!item) return null;
    this._equipped.delete(slot);
    this.emit('item-unequipped', slot, item);
    return item;
  }

  /** Get equipped item in a slot */
  getEquipped(slot: string): ItemDef | null {
    return this._equipped.get(slot) ?? null;
  }

  /** Get all inventory slots (non-empty) */
  getItems(): InventorySlot[] {
    return [...this._slots];
  }

  /** Is inventory full? */
  get isFull(): boolean {
    return this._slots.length >= this._maxSlots;
  }

  /** Current used slot count */
  get slotCount(): number {
    return this._slots.length;
  }

  /** Maximum slot count */
  get maxSlots(): number {
    return this._maxSlots;
  }
}
