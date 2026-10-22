// apps/web/src/modules/identity/server/container.ts
// Composição: monta os casos de uso com os adapters reais. Instância única por processo.
import 'server-only';
import {
  Autenticar, ConfirmarCadastroMfa, RedefinirSenha, SolicitarCodigoEmail, SolicitarRedefinicaoSenha, VerificarMfa,
  type DependenciasIdentity,
} from '@app/identity';
import { CifradorAesGcm } from '@app/infra/identity/cifrador-aes-gcm';
import { EnviadorSmtp } from '@app/infra/identity/email/enviador-smtp';
import { GeradorAleatorioNode } from '@app/infra/identity/gerador-aleatorio-node';
import { HasherArgon2 } from '@app/infra/identity/hasher-argon2';
import { UsuarioPrismaRepository } from '@app/infra/identity/prisma/usuario.prisma-repository';
import { DesafioMfaRedis } from '@app/infra/identity/redis/desafio-mfa-redis';
import { LimitadorRedis } from '@app/infra/identity/redis/limitador-redis';
import { SessaoRedis } from '@app/infra/identity/redis/sessao-redis';
import { TokenRedefinicaoRedis } from '@app/infra/identity/redis/token-redefinicao-redis';
import { SenhaVazadaHibp } from '@app/infra/identity/senha-vazada-hibp';
import { TotpRfc6238 } from '@app/infra/identity/totp-rfc6238';
import { auditoria } from '@app/infra/observabilidade';
import { prisma } from '@app/infra/db';
import { redis } from '@app/infra/cache';

const nomeApp = process.env.APP_NAME ?? 'App';
export const sessoes = new SessaoRedis(redis);

async function criar() {
  const d: DependenciasIdentity = {
    usuarios: new UsuarioPrismaRepository(prisma),
    desafios: new DesafioMfaRedis(redis),
    hasher: await HasherArgon2.criar(),
    senhasVazadas: new SenhaVazadaHibp(),
    totp: new TotpRfc6238(nomeApp),
    limitador: new LimitadorRedis(redis),
    sessoes,
    tokensRedefinicao: new TokenRedefinicaoRedis(redis),
    // Mesmo servidor SMTP do NexusCMS (Dokploy): basta copiar as variáveis MAIL_* do .env do Nexus.
    email: EnviadorSmtp.criar(EnviadorSmtp.configDoAmbiente(process.env), {
      nomeApp, corPrimaria: process.env.APP_COR_PRIMARIA ?? '#6349F6', rodape: `© ${new Date().getFullYear()} ${nomeApp}`,
    }),
    aleatorio: new GeradorAleatorioNode(),
    cifrador: CifradorAesGcm.doAmbiente(process.env),
    auditoria,
    relogio: { agora: () => new Date() },
    config: { mfaObrigatorio: process.env.MFA_OBRIGATORIO !== 'false', urlApp: process.env.APP_URL!, nomeApp },
  };
  return {
    autenticar: new Autenticar(d),
    confirmarCadastroMfa: new ConfirmarCadastroMfa(d),
    verificarMfa: new VerificarMfa(d),
    solicitarCodigoEmail: new SolicitarCodigoEmail(d),
    solicitarRedefinicaoSenha: new SolicitarRedefinicaoSenha(d),
    redefinirSenha: new RedefinirSenha(d),
  };
}

let instancia: ReturnType<typeof criar> | undefined;
export const identity = () => (instancia ??= criar());
