// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private ds: DataSource) {}
  @Get() get() { return { status: this.ds.isInitialized ? 'ok' : 'error' }; }
  @Get('live') live() { return { alive: true }; }
  @Get('ready') ready() { return { ready: this.ds.isInitialized }; }
}
