import type { Result } from '@app/kernel';
import type { DesafioMfa } from '../dominio/desafio-mfa.entity';
import type { Usuario } from '../dominio/usuario.entity';
import type { DependenciasIdentity } from './portas';

/** Gera o código de 6 dígitos, guarda só o HMAC no desafio e envia por e-mail. */
export async function emitirCodigoEmail(d: DependenciasIdentity, desafio: DesafioMfa, usuario: Usuario, agora: Date): Promise<Result<void>> {
  const codigo = d.aleatorio.codigoNumerico(6);
  const r = desafio.emitirCodigoEmail(hashCodigoEmail(d, desafio.id.valor, codigo), agora);
  if (r.ok) await d.email.enviar({ para: usuario.email.valor, modelo: 'CODIGO_MFA', dados: { codigo, validadeMinutos: 10 } });
  return r;
}

export const hashCodigoEmail = (d: DependenciasIdentity, desafioId: string, codigo: string) =>
  d.cifrador.indiceCego(`mfa-email:${desafioId}:${codigo.trim()}`);

export const hashCodigoRecuperacao = (d: DependenciasIdentity, codigo: string) =>
  d.cifrador.indiceCego(`mfa-recuperacao:${codigo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}`);
