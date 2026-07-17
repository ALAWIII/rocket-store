import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import path from 'node:path';
import { v7 } from 'uuid';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const level = config.get<string>('LOG_LEVEL') ?? 'info';

        return {
          pinoHttp: {
            level,
            autoLogging: true,
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
            transport: {
              targets: [
                {
                  level,
                  target: 'pino-roll',
                  options: {
                    file: path.join('logs', 'app'),
                    frequency: 'hourly',
                    dateFormat: 'yyyy-MM-dd-HH',
                    extension: '.jsonl',
                    mkdir: true,
                    limit: { count: 168 }, // 7 days
                  },
                },
              ],
            },
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
