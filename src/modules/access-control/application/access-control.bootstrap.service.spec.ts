import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlBootstrapService } from './access-control.bootstrap.service';

describe('AccessControlBootstrapService', () => {
  let service: AccessControlBootstrapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessControlBootstrapService],
    }).compile();

    service = module.get<AccessControlBootstrapService>(
      AccessControlBootstrapService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
