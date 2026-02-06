import { Facade } from './Facade.js';
import { PrefabSystem } from '../prefabs/PrefabSystem.js';
import { IEntity, PrefabConfig } from '../contracts/Prefab.js';

/**
 * Static Prefabs facade for entity/prefab management.
 *
 * @example
 * ```typescript
 * import { Prefabs } from 'gamebyte-framework';
 *
 * Prefabs.register({
 *   id: 'enemy',
 *   name: 'Enemy',
 *   visual: { type: 'model', url: '/models/enemy.glb' },
 *   tags: ['npc', 'enemy']
 * });
 *
 * const enemy = await Prefabs.spawn('enemy', { position: [0, 0, 5] });
 * enemy.addComponent('health', { current: 100, max: 100 });
 *
 * const npcs = Prefabs.getEntitiesByTag('npc');
 * const save = Prefabs.serialize();
 * ```
 */
export class Prefabs extends Facade {
  protected static getFacadeAccessor(): string {
    return 'prefabs';
  }

  private static getSystem(): PrefabSystem {
    return this.resolve<PrefabSystem>();
  }

  static register(config: PrefabConfig): void {
    this.getSystem().register(config);
  }

  static registerFromJSON(json: unknown): void {
    this.getSystem().registerFromJSON(json);
  }

  static has(prefabId: string): boolean {
    return this.getSystem().has(prefabId);
  }

  static async spawn(
    prefabId: string,
    overrides?: Partial<PrefabConfig['transform']>
  ): Promise<IEntity> {
    return this.getSystem().spawn(prefabId, overrides);
  }

  static despawn(entity: IEntity): void {
    this.getSystem().despawn(entity);
  }

  static getEntities(): IEntity[] {
    return this.getSystem().getEntities();
  }

  static getEntitiesByTag(tag: string): IEntity[] {
    return this.getSystem().getEntitiesByTag(tag);
  }

  static serialize(): string {
    return this.getSystem().serialize();
  }

  static async deserialize(data: string): Promise<void> {
    return this.getSystem().deserialize(data);
  }
}
