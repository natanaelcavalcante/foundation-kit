import { falha, Id, Result } from '@app/kernel';
import { DESAFIO_MAX_TENTATIVAS, type DesafioMfa, type TipoDesafio } from '../dominio/desafio-mfa.entity';
import type { Usuario } from '../dominio/usuario.entity';
import type { DependenciasIdentity } from './portas';

/** Carrega desafio + usuário e valida que ainda podem prosseguir. Qualquer problema → `DESAFIO_INVALIDO`. */
export async function carregarDesafio(
  d: DependenciasIdentity,
  desafioId: unknown,
  tipo: TipoDesafio,
  agora: Date,
): Promise<Result<{ desafio: DesafioMfa; usuario: Usuario }>> {
  const invalido = Result.fail<never>(falha('DESAFIO_INVALIDO', 'nao_autenticado'));
  const id = Id.criar(desafioId, 'desafioId');
  if (id.falhou) return invalido;
  const desafio = await d.desafios.buscar(id.valor);
  if (!desafio || desafio.validoPara(tipo, agora).falhou) return invalido;
  const usuario = await d.usuarios.buscarPorId(desafio.usuarioId);
  if (!usuario || usuario.podeAutenticar().falhou) {
    await d.desafios.remover(desafio.id);
    return invalido;
  }
  return Result.ok({ desafio, usuario });
}

/** Contabiliza a tentativa errada; ao esgotar, o desafio é descartado e o login recomeça do zero. */
export async function falhaNoDesafio(d: DependenciasIdentity, desafio: DesafioMfa, ip: string): Promise<Result<never>> {
  desafio.registrarFalha();
  await d.auditoria.registrar('MFA_FALHA', { usuarioId: desafio.usuarioId.valor, ip, tentativas: desafio.tentativasFalhas });
  if (desafio.esgotado) {
    await d.desafios.remover(desafio.id);
    return Result.fail(falha('DESAFIO_ESGOTADO', 'nao_autenticado'));
  }
  await d.desafios.salvar(desafio);
  return Result.fail(falha('CODIGO_INVALIDO', 'nao_autenticado', { detalhes: { tentativasRestantes: DESAFIO_MAX_TENTATIVAS - desafio.tentativasFalhas } }));
}
