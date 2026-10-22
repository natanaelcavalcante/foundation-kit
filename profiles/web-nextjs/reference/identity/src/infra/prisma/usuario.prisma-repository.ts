// Adapter Prisma do UsuarioRepository. Coberto pelo teste de integração do projeto (Testcontainers),
// não pelos testes deste pacote de referência.
import { Id } from '@app/kernel';
import type { PrismaClient, Usuario as UsuarioRow } from '@prisma/client';
import type { UsuarioRepository } from '../../aplicacao/portas';
import { Email } from '../../dominio/email.vo';
import { Usuario } from '../../dominio/usuario.entity';

const toDomain = (r: UsuarioRow): Usuario =>
  Usuario.restaurar({
    id: Id.criar(r.id).valor,
    email: Email.criar(r.email).valor,
    nome: r.nome,
    senhaHash: r.senhaHash,
    status: r.status,
    mfa: { segredoCifrado: r.mfaSegredoCifrado, confirmado: r.mfaConfirmado, metodoPreferido: r.mfaMetodoPreferido, ultimoPassoTotp: r.mfaUltimoPassoTotp },
    codigosRecuperacao: r.codigosRecuperacao,
  });

export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(private readonly db: PrismaClient) {}

  async buscarPorEmail(email: Email) {
    const r = await this.db.usuario.findUnique({ where: { email: email.valor } });
    return r ? toDomain(r) : null;
  }

  async buscarPorId(id: Id) {
    const r = await this.db.usuario.findUnique({ where: { id: id.valor } });
    return r ? toDomain(r) : null;
  }

  async salvar(u: Usuario): Promise<void> {
    const data = {
      email: u.email.valor,
      nome: u.nome,
      senhaHash: u.senhaHash,
      status: u.status,
      mfaSegredoCifrado: u.mfa.segredoCifrado,
      mfaConfirmado: u.mfa.confirmado,
      mfaMetodoPreferido: u.mfa.metodoPreferido,
      mfaUltimoPassoTotp: u.mfa.ultimoPassoTotp,
      codigosRecuperacao: [...u.hashesCodigosRecuperacao],
    };
    await this.db.usuario.upsert({ where: { id: u.id.valor }, create: { id: u.id.valor, ...data }, update: data });
  }
}
