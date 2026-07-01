import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Hub-issued JWT 가 필요한 라우트에 사용. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
