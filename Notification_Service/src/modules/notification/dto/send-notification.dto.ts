import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['TRIP_VERIFIED', 'LISTING_CREATED', 'LISTING_SOLD', 'PAYMENT_COMPLETED', 'CREDIT_ISSUED', 'WITHDRAWAL_APPROVED', 'SYSTEM_ALERT'])
  @IsNotEmpty()
  type: string;

  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  @IsNotEmpty()
  channel: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class SendInternalNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'], { each: true })
  @IsOptional()
  channels?: string[];
}
