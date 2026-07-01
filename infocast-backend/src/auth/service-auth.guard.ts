import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * 서버-서버(생태계 내부) 호출 인증.
 * 헤더: Authorization: Bearer <AUTH_SERVICE_SECRET>, X-Service-Id: <호출자 식별자>.
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const secret = this.config.get<string>('AUTH_SERVICE_SECRET');
    const token = (req.headers['authorization'] ?? '').toString().replace(/^Bearer\s+/i, '');
    const serviceId = (req.headers['x-service-id'] ?? '').toString();

    if (!secret || token !== secret || !serviceId) {
      throw new UnauthorizedException('서비스 인증 실패');
    }
    return true;
  }
}
