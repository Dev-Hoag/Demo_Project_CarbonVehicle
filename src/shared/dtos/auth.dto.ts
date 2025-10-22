import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEmail, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Username for login', example: 'admin_super' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Password for login', example: 'admin123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class AdminUserCreateDto {
  @ApiProperty({ description: 'Username for new admin', example: 'new_admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Email for new admin', example: 'new@admin.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password for new admin', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Full name for new admin', example: 'New Admin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class AdminUserUpdateDto {
  @ApiProperty({ description: 'Updated email', example: 'updated@admin.com', required: false })
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Updated full name', example: 'Updated Name', required: false })
  @IsString()
  fullName?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User info' })
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
  };
}

export class CurrentUserDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Is super admin' })
  isSuperAdmin: boolean;
}
export class LockReasonDto {
  @ApiProperty({ description: 'Reason', example: 'Suspicious activity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
