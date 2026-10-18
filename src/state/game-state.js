import { EventBus } from '../core/event-bus.js';

/**
 * The shared game object: services every scene can reach.
 * Session-only state lives in the scenes; saved progress lives in
 * `progress` (a ProgressStore) and is written by SaveService.
 * @param {any} services
 */
export function createGame(services) {
  return {
    bus: new EventBus(),
    /** @type {import('./progress-store.js').ProgressStore|null} */
    progress: null,
    debug: { scene: '' },
    ...services,
  };
}
