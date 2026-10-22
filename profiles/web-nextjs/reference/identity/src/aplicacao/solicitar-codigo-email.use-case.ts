import { Result } from '@app/kernel';
import { emitirCodigoEmail } from './codigo-email';
import { carregarDesafio } from './desafio';
import type { DependenciasIdentity } from './portas';

/** "Não consigo usar o app agora": troca o desafio para código por e-mail (intervalo mínimo de 60s entre envios). */
export class SolicitarCodigoEmail {
  constructor(private readonly d: DependenciasIdentity) {}

  async executar(e: { desafioId: string }): Promise<Result<{ emailMascarado: string }>> {
    const agora = this.d.relogio.agora();
    const carga = await carregarDesafio(this.d, e.desafioId, 'VERIFICACAO', agora);
    if (carga.falhou) return Result.fail(carga.falhas);
    const { desafio, usuario } = carga.valor;

    const emitido = await emitirCodigoEmail(this.d, desafio, usuario, agora);
    if (emitido.falhou) return Result.fail(emitido.falhas);
    await this.d.desafios.salvar(desafio);
    return Result.ok({ emailMascarado: usuario.email.mascarado });
  }
}
