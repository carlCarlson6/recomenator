export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly avatarUrl: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: { id: string; email: string; avatarUrl?: string | null }): User {
    return new User(input.id, input.email, input.avatarUrl ?? null, new Date());
  }

  static reconstitute(input: { id: string; email: string; avatarUrl: string | null; createdAt: Date }): User {
    return new User(input.id, input.email, input.avatarUrl, input.createdAt);
  }
}
