import type { ModeloEmail } from '../../aplicacao/portas';

export interface Marca { nomeApp: string; corPrimaria: string; rodape: string }

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Layout base (mesmo visual do e-mail de 2FA do NexusCMS). */
function layout(m: Marca, titulo: string, corpo: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
<div style="text-align:center;margin-bottom:30px;font-size:24px;font-weight:bold;color:${m.corPrimaria}">${esc(m.nomeApp)}</div>
<h2 style="text-align:center;color:#1a1a1a">${esc(titulo)}</h2>${corpo}
<div style="color:#999;font-size:12px;text-align:center;margin-top:30px;border-top:1px solid #eee;padding-top:20px">${esc(m.rodape)}</div>
</div></body></html>`;
}

const p = (t: string) => `<p style="color:#555;text-align:center">${t}</p>`;
const aviso = (t: string) => `<p style="color:#666;font-size:14px;text-align:center;margin-top:20px">${t}</p>`;
const naoFoiVoce = aviso('Se não foi você, troque sua senha imediatamente e fale com o suporte.');

type Render = (d: Record<string, string | number>, m: Marca) => { assunto: string; html: string; texto: string };

const MODELOS: Record<ModeloEmail, Render> = {
  CODIGO_MFA: (d, m) => ({
    assunto: `${m.nomeApp}: seu código de verificação`,
    texto: `Seu código de verificação é ${d.codigo}. Expira em ${d.validadeMinutos} minutos. Não compartilhe.`,
    html: layout(m, 'Verificação em Duas Etapas',
      p('Utilize o código abaixo para concluir seu acesso:') +
      `<div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;text-align:center;background:#f8f7ff;border:2px solid ${m.corPrimaria};border-radius:8px;padding:20px;margin:24px 0">${esc(d.codigo ?? '')}</div>` +
      aviso(`Este código expira em <strong>${esc(d.validadeMinutos ?? 10)} minutos</strong>.`) + aviso('Não compartilhe este código com ninguém.') +
      aviso('Se você não solicitou este código, ignore este e-mail.')),
  }),
  REDEFINIR_SENHA: (d, m) => ({
    assunto: `${m.nomeApp}: redefinição de senha`,
    texto: `Para redefinir sua senha acesse: ${d.link} (válido por ${d.validadeMinutos} minutos). Se não foi você, ignore.`,
    html: layout(m, 'Redefinição de Senha',
      p('Recebemos um pedido para redefinir sua senha.') +
      `<p style="text-align:center;margin:28px 0"><a href="${esc(d.link ?? '')}" style="background:${m.corPrimaria};color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Redefinir senha</a></p>` +
      aviso(`O link expira em <strong>${esc(d.validadeMinutos ?? 30)} minutos</strong> e só pode ser usado uma vez.`) +
      aviso('Se você não pediu, ignore este e-mail — sua senha continua a mesma.')),
  }),
  SENHA_ALTERADA: (d, m) => ({
    assunto: `${m.nomeApp}: sua senha foi alterada`,
    texto: `Sua senha foi alterada (IP ${d.ip}). Todas as sessões foram encerradas. Se não foi você, contate o suporte.`,
    html: layout(m, 'Senha Alterada', p(`Sua senha foi alterada a partir do IP <strong>${esc(d.ip ?? '')}</strong>. Todas as sessões abertas foram encerradas.`) + naoFoiVoce),
  }),
  CONTA_BLOQUEADA: (d, m) => ({
    assunto: `${m.nomeApp}: acesso bloqueado temporariamente`,
    texto: `Detectamos várias tentativas de login com senha errada (IP ${d.ip}). O acesso foi bloqueado temporariamente.`,
    html: layout(m, 'Acesso Bloqueado Temporariamente',
      p(`Detectamos várias tentativas de login com senha incorreta na sua conta (IP <strong>${esc(d.ip ?? '')}</strong>). Por segurança, o acesso foi bloqueado temporariamente.`) + naoFoiVoce),
  }),
  MFA_ATIVADO: (d, m) => ({
    assunto: `${m.nomeApp}: verificação em duas etapas ativada`,
    texto: `A verificação em duas etapas foi ativada na sua conta (IP ${d.ip}).`,
    html: layout(m, 'Verificação em Duas Etapas Ativada', p('Seu app autenticador foi configurado. Guarde seus códigos de recuperação em local seguro.') + naoFoiVoce),
  }),
  CODIGO_RECUPERACAO_USADO: (d, m) => ({
    assunto: `${m.nomeApp}: código de recuperação utilizado`,
    texto: `Um código de recuperação foi usado para entrar na sua conta (IP ${d.ip}). Restam ${d.restantes}.`,
    html: layout(m, 'Código de Recuperação Utilizado',
      p(`Um código de recuperação foi usado para entrar na sua conta (IP <strong>${esc(d.ip ?? '')}</strong>). Restam <strong>${esc(d.restantes ?? 0)}</strong> códigos.`) + naoFoiVoce),
  }),
};

export function renderizar(modelo: ModeloEmail, dados: Record<string, string | number>, marca: Marca) {
  return MODELOS[modelo](dados, marca);
}
