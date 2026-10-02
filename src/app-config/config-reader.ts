import { ConfigService } from '@nestjs/config';

// src/app-config/config-reader.ts
export class ConfigReader {
  constructor(private readonly configService: ConfigService) {}
  get<T>(key: string, defaultValue: T): T {
    return this.configService.get(key, defaultValue);
  }
  getOrThrow<T>(key: string): T {
    return this.configService.getOrThrow(key);
  }
}
