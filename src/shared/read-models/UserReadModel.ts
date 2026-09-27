/**
 * Read-model port for resolving user display information across modules.
 *
 * This is intentionally not an aggregate repository: it returns plain,
 * denormalized data optimized for read-heavy UI use cases.
 */
export interface UserReadModel {
  /**
   * Returns a map of userId -> display name for the given user IDs.
   *
   * The fallback chain is:
   *   username -> email -> 'Anonymous'
   */
  findDisplayNamesByIds(userIds: string[]): Promise<Map<string, string>>;
}
