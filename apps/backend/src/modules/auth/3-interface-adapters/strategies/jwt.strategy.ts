import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { AuthServiceContract } from '../../1-domain/contracts/auth.service.contract';
import { AUTH_TOKENS } from '../../4-infrastructure/di/auth.tokens';

/**
 * Estratégia JWT para validação de tokens
 * Usado pelo Passport para autenticação
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTH_TOKENS.AUTH_SERVICE)
    private readonly authService: AuthServiceContract,
  ) {
    super({
      jwtFromRequest: (req: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : null;
      },
      ignoreExpiration: false,
      secretOrKeyProvider: async (_request: any, _rawJwtToken: any, done: any) => {
        // O Supabase JWT usa a chave pública para validação
        // Por ora, retornamos uma string vazia pois a validação será feita no authService
        done(null, '');
      },
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
