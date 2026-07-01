import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // Hub user id
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Hub가 발급한 JWT 검증.
 * - 알고리즘 HS512, secret 은 Base64 인코딩 → Buffer.from(secret, 'base64').
 * - AUTH_JWT_SECRET 은 생태계 공유 값. 절대 변경 금지.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('AUTH_JWT_SECRET');
    if (!secret) {
      throw new Error('AUTH_JWT_SECRET 누락 — 생태계 공유 값이 필요합니다.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(secret, 'base64'),
      algorithms: ['HS512'],
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub) {
      throw new UnauthorizedException('유효하지 않은 토큰');
    }
    return payload;
  }
}
