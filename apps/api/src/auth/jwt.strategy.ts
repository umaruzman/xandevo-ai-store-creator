import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type User } from '@prisma/client';
import {
  API_JWT_ALGORITHM,
  API_JWT_AUDIENCE,
  API_JWT_ISSUER,
  type ApiJwtClaims,
} from '@xandevo/shared';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';

import { UsersService } from '../users/users.service';

function requireSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_JWT_SECRET is missing or too short (need >= 16 chars)');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: requireSecret(),
      issuer: API_JWT_ISSUER,
      audience: API_JWT_AUDIENCE,
      algorithms: [API_JWT_ALGORITHM],
      ignoreExpiration: false,
    } satisfies StrategyOptions);
  }

  /** Runs only after signature, `iss`, `aud` and `exp` have passed. */
  async validate(payload: ApiJwtClaims): Promise<User> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('token is missing required claims');
    }
    return this.users.upsertFromClaims(payload);
  }
}
