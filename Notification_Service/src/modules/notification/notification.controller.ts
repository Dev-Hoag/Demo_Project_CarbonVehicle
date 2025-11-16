import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto, SendInternalNotificationDto } from './dto/send-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /api/notifications - Get user's notifications (paginated)
   */
  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationService.getNotifications(userId, +page, +limit);
  }

  /**
   * GET /api/notifications/unread - Get unread notification count
   */
  @Get('unread')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  /**
   * PUT /api/notifications/:id/read - Mark notification as read
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ) {
    return this.notificationService.markAsRead(userId, +id);
  }

  /**
   * POST /api/notifications/read-all - Mark all notifications as read
   */
  @Post('read-all')
  async markAllAsRead(@Body('userId') userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  /**
   * DELETE /api/notifications/:id - Delete a notification
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ) {
    await this.notificationService.deleteNotification(userId, +id);
    return { message: 'Notification deleted successfully' };
  }

  /**
   * GET /api/notifications/preferences - Get user notification preferences
   */
  @Get('preferences')
  async getPreferences(@Query('userId') userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  /**
   * PUT /api/notifications/preferences - Update user notification preferences
   */
  @Put('preferences')
  async updatePreferences(
    @Query('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationService.updatePreferences(userId, dto);
  }

  /**
   * GET /api/notifications/history - Get notification history
   */
  @Get('history')
  async getHistory(
    @Query('userId') userId: string,
    @Query('days') days = 30,
  ) {
    return this.notificationService.getNotificationHistory(userId, +days);
  }

  /**
   * POST /api/notifications/register-device - Register FCM device token
   */
  @Post('register-device')
  async registerDevice(@Body() dto: RegisterDeviceDto) {
    return this.notificationService.registerDevice(dto);
  }

  /**
   * POST /api/notifications/test - Send test notification
   */
  @Post('test')
  async sendTestNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }
}

/**
 * Internal controller for inter-service communication
 */
@Controller('internal/notifications')
export class InternalNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * POST /internal/notifications/send - Send notification using template
   * Used by other microservices via RabbitMQ or HTTP
   */
  @Post('send')
  async sendNotification(@Body() dto: SendInternalNotificationDto) {
    return this.notificationService.sendInternalNotification(dto);
  }
}
