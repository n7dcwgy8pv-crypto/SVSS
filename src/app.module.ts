import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { ProfileModule } from './profile/profile.module';
import { TicketsModule } from './tickets/tickets.module';
import { IncidentsModule } from './incidents/incidents.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { EventsModule } from './events/events.module';
import { CustomerTicketsModule } from './customer-tickets/customer-tickets.module';

// JWT Strategy (passport)
import { AuthModule as LibAuthModule } from './libs/auth/auth.module';

@Module({
  imports: [
    // Schedule support
    ScheduleModule.forRoot(),

    // Environment config (global)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),

    // MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/svss',
    ),

    // Static file serving for uploaded photos
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads'),
      serveRoot: '/uploads',
    }),

    // JWT (global — available to all modules)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme_use_env',
      signOptions: {
        expiresIn: '24h',
      },
      global: true,
    }),

    // Passport/JWT strategy
    LibAuthModule,

    // Feature modules
    AuthModule,
    CustomerAuthModule,
    ProfileModule,
    TicketsModule,
    IncidentsModule,
    UsersModule,
    DashboardModule,
    ReportsModule,
    EventsModule,
    CustomerTicketsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally so @Throttle() decorators take effect
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    void _consumer;
    // Additional middleware can be configured here
  }
}
