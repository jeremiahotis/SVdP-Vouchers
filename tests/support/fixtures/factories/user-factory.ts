import { faker } from '@faker-js/faker';

type User = {
  id: string;
  email: string;
  name: string;
  password: string;
};

export class UserFactory {
  private createdUserIds: string[] = [];

  createUser(overrides: Partial<User> = {}): User {
    const user: User = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: faker.internet.password({ length: 12 }),
      ...overrides,
    };

    this.createdUserIds.push(user.id);
    return user;
  }

  async cleanup(): Promise<void> {
    // TODO: Replace with API/DB cleanup once user creation exists.
    this.createdUserIds = [];
  }
}
