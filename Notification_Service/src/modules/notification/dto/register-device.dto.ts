import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(['ANDROID', 'IOS', 'WEB'])
  @IsNotEmpty()
  deviceType: 'ANDROID' | 'IOS' | 'WEB';

  @IsString()
  @IsOptional()
  deviceName?: string;
}
