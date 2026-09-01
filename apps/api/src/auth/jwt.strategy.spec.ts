process.env.AUTH_JWT_SECRET = 'test-secret-at-least-16-chars';

import { UnauthorizedException } from '@nestjs/common';

import { type UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const users = { upsertFromClaims: jest.fn() } as unknown as jest.Mocked<UsersService>;
  const strategy = new JwtStrategy(users);

  afterEach(() => jest.resetAllMocks());

  it('provisions the user from valid claims', async () => {
    const user = { id: 'u1' };
    (users.upsertFromClaims as jest.Mock).mockResolvedValue(user);

    await expect(strategy.validate({ sub: 'g-1', email: 'a@b.com', name: 'A' })).resolves.toBe(
      user,
    );
    expect(users.upsertFromClaims).toHaveBeenCalledWith({
      sub: 'g-1',
      email: 'a@b.com',
      name: 'A',
    });
  });

  it('rejects a token missing required claims', async () => {
    await expect(strategy.validate({ sub: '', email: '' } as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(users.upsertFromClaims).not.toHaveBeenCalled();
  });

  it('refuses to construct without a strong AUTH_JWT_SECRET', () => {
    const prev = process.env.AUTH_JWT_SECRET;
    process.env.AUTH_JWT_SECRET = 'short';
    expect(() => new JwtStrategy(users)).toThrow(/AUTH_JWT_SECRET/);
    process.env.AUTH_JWT_SECRET = prev;
  });
});
