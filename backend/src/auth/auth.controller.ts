import {
  Controller,
  Post,
  Body,
  HttpCode,
  Res,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt.guard';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['CLIENT', 'FREELANCER'])
  role?: 'CLIENT' | 'FREELANCER';
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);
    // set httpOnly cookie
    const cookieName = process.env.COOKIE_NAME ?? 'jid';
    const cookieSecure = process.env.COOKIE_SECURE === 'true';
    res.cookie(cookieName, result.token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return result.user;
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) return { error: 'Invalid credentials' };
    const result = await this.auth.login(user);
    const cookieName = process.env.COOKIE_NAME ?? 'jid';
    const cookieSecure = process.env.COOKIE_SECURE === 'true';
    res.cookie(cookieName, result.token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return result.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const userId = (req as any).user?.sub as string;
    const user = await this.auth.me(userId);
    return user;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.COOKIE_NAME ?? 'jid';
    res.clearCookie(cookieName, { httpOnly: true });
    return { ok: true };
  }
}
