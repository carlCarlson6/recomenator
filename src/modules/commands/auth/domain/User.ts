export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly username: string | null,
    readonly avatarUrl: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: { id: string; email: string; username?: string | null; avatarUrl?: string | null }): User {
    return new User(input.id, input.email, input.username ?? null, input.avatarUrl ?? null, new Date());
  }

  static reconstitute(input: {
    id: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  }): User {
    return new User(input.id, input.email, input.username, input.avatarUrl, input.createdAt);
  }
}
