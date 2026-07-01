import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtPayload } from './jwt.strategy';

class VerifyCodeDto {
  @IsString()
  @MinLength(1)
  code!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 프론트가 받은 sso_code 를 넘기면 Hub와 교환해 access token 반환. */
  @Post('sso/exchange')
  exchange(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.code);
  }

  /** 현재 토큰의 사용자 확인 (검증용). */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return { id: user.sub, email: user.email, name: user.name };
  }
}
