import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

/**
 * 관리자 권한 가드.
 * 우선순위: JWT 의 role/roles 클레임에 'admin' → 허용.
 * 그 외 ADMIN_EMAILS(쉼표구분) 화이트리스트의 이메일 → 허용.
 * JwtAuthGuard 뒤에 배치(req.user 가 채워진 상태 가정).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload | undefined;
    if (!user) throw new ForbiddenException('인증 필요');

    const roleClaim = user.role ?? user.roles;
    const roles = Array.isArray(roleClaim)
      ? roleClaim.map((r) => String(r).toLowerCase())
      : roleClaim
        ? [String(roleClaim).toLowerCase()]
        : [];
    if (roles.includes('admin')) return true;

    const allow = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (user.email && allow.includes(String(user.email).toLowerCase())) return true;

    throw new ForbiddenException('관리자 권한 필요');
  }
}
