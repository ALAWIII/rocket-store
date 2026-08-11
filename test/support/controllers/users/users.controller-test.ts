import { UserAgent } from 'test/support/helpers/app-test.helper';

export class UsersControllerTest {
  constructor(private readonly agent: UserAgent) {}
  withAgent(agent: UserAgent): UsersControllerTest {
    return new UsersControllerTest(agent);
  }
  findMe() {}
  findAll() {}
  findById() {}
  updateMe() {}
  assignRole() {}
  reassignUsersRole() {}
}
