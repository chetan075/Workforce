import {
  Controller,
  Get,
  Post,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DatabaseSyncService } from './database-sync.service';
import { MongoDBService } from './mongodb.service';

@Controller('api/database')
export class DatabaseController {
  constructor(
    private readonly syncService: DatabaseSyncService,
    private readonly mongoService: MongoDBService,
  ) {}

  @Get('health')
  async checkHealth() {
    try {
      const health = await this.syncService.checkSyncHealth();
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        databases: health,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Health check failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/initial')
  async performInitialSync() {
    try {
      await this.syncService.performInitialSync();
      return {
        status: 'success',
        message: 'Initial database sync completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Initial sync failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/users')
  async syncUsers() {
    try {
      await this.syncService.syncAllUsers();
      return {
        status: 'success',
        message: 'User sync completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'User sync failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/invoices')
  async syncInvoices() {
    try {
      await this.syncService.syncAllInvoices();
      return {
        status: 'success',
        message: 'Invoice sync completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Invoice sync failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/system')
  async getSystemAnalytics(@Query('days') days?: string) {
    try {
      const dayCount = days ? parseInt(days) : 7;
      const analytics = await this.mongoService.getSystemMetrics(dayCount);

      return {
        status: 'success',
        data: analytics,
        period: `${dayCount} days`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve analytics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/user/:userId')
  async getUserAnalytics(
    @Query('userId') userId: string,
    @Query('days') days?: string,
  ) {
    try {
      const dayCount = days ? parseInt(days) : 30;
      const analytics = await this.mongoService.getUserAnalytics(
        userId,
        dayCount,
      );

      return {
        status: 'success',
        data: analytics,
        userId,
        period: `${dayCount} days`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve user analytics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/users')
  async searchUsers(@Query('q') query: string) {
    try {
      if (!query || query.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const users = await this.mongoService.searchUsers(query);

      return {
        status: 'success',
        data: users,
        query,
        count: users.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Search failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/projects')
  async searchProjects(@Query('q') query: string) {
    try {
      if (!query || query.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const projects = await this.mongoService.searchProjects(query);

      return {
        status: 'success',
        data: projects,
        query,
        count: projects.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Search failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('collections')
  async listCollections() {
    try {
      const health = await this.mongoService.healthCheck();

      return {
        status: 'success',
        collections: health.collections,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to list collections',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
