import nodemailer, { type Transporter } from 'nodemailer';
import type { EnviadorEmail, ModeloEmail } from '../../aplicacao/portas';
import { renderizar, type Marca } from './modelos';

export interface ConfigSmtp {
  host: string;
  porta: number;
  /** `ssl` = TLS implícito (465); `tls` = STARTTLS obrigatório (587); `nenhuma` só para dev (Mailpit). */
  criptografia: 'ssl' | 'tls' | 'nenhuma';
  usuario?: string;
  senha?: string;
  remetente: { email: string; nome: string };
}

/**
 * Envio por SMTP — compatível com o servidor de e-mail próprio usado pelo NexusCMS (Dokploy).
 * Lê as MESMAS variáveis do Laravel (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
 * `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`), então dá para reaproveitar os valores do .env do Nexus.
 */
export class EnviadorSmtp implements EnviadorEmail {
  constructor(private readonly transporte: Pick<Transporter, 'sendMail'>, private readonly remetente: ConfigSmtp['remetente'], private readonly marca: Marca) {}

  static configDoAmbiente(env: Record<string, string | undefined>): ConfigSmtp {
    const host = env.MAIL_HOST;
    const from = env.MAIL_FROM_ADDRESS;
    if (!host || !from) throw new Error('MAIL_HOST e MAIL_FROM_ADDRESS são obrigatórios');
    const enc = (env.MAIL_ENCRYPTION ?? 'tls').toLowerCase();
    const criptografia = enc === 'ssl' || enc === 'smtps' ? 'ssl' : enc === 'null' || enc === '' || enc === 'none' ? 'nenhuma' : 'tls';
    const cfg: ConfigSmtp = {
      host,
      porta: Number(env.MAIL_PORT ?? (criptografia === 'ssl' ? 465 : 587)),
      criptografia,
      remetente: { email: from, nome: env.MAIL_FROM_NAME ?? '' },
    };
    if (env.MAIL_USERNAME) cfg.usuario = env.MAIL_USERNAME;
    if (env.MAIL_PASSWORD) cfg.senha = env.MAIL_PASSWORD;
    return cfg;
  }

  static criar(cfg: ConfigSmtp, marca: Marca): EnviadorSmtp {
    const transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.porta,
      secure: cfg.criptografia === 'ssl',
      requireTLS: cfg.criptografia === 'tls',
      ...(cfg.usuario ? { auth: { user: cfg.usuario, pass: cfg.senha ?? '' } } : {}),
      tls: { minVersion: 'TLSv1.2' },
      connectionTimeout: 10_000,
    });
    return new EnviadorSmtp(transporte, cfg.remetente, marca);
  }

  async enviar(m: { para: string; modelo: ModeloEmail; dados: Record<string, string | number> }): Promise<void> {
    const { assunto, html, texto } = renderizar(m.modelo, m.dados, this.marca);
    await this.transporte.sendMail({
      from: { name: this.remetente.nome, address: this.remetente.email },
      to: m.para,
      subject: assunto,
      html,
      text: texto,
    });
  }
}
