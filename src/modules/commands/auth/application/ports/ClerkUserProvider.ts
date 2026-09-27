export interface ClerkUserProvider {
  getUsername(userId: string): Promise<string | null>;
}
