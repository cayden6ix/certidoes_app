import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

/**
 * Estratégia JWT para validação de tokens
 * Usado pelo Passport para autenticação
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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
