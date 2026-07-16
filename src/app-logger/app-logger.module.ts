import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { v7 } from 'uuid';

const DEVELOPMENT_OPTIONS = {
  transport: {
    target: 'pino-pretty',
    options: {
      singleLine: true,
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
  autoLogging: true, // enabled by default for both, but put here to ensure that its required in development environment.
};
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL') ?? 'info',
            genReqId: (req, res) => {
              const inReqId = req.headers['x-request-id'];
              const reqId =
                typeof inReqId === 'string' && inReqId.trim() !== ''
                  ? inReqId
                  : undefined;
              const id = v7();
              res.setHeader('x-request-id', reqId ?? id);
              return id;
            },
            ...(isDev ? DEVELOPMENT_OPTIONS : undefined),
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
