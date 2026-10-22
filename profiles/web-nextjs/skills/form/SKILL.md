---
name: form
description: Cria ou revisa formulários e telas de módulo no perfil web-nextjs — React Hook Form + Zod + shadcn/ui, schemas em apps/web/src/modules/<m>/schemas, mapeamento de falhas do servidor para campos, estados de carregamento/vazio/erro, acessibilidade e i18n. Usar ao construir a UI de um caso de uso.
---

# Formulário / Tela

## Regras
- O schema Zod do form fica em `apps/web/src/modules/<m>/schemas/<acao>.schema.ts` e **reaproveita o mesmo schema da rota** sempre que possível (uma fonte de verdade). A validação do cliente é UX; a do servidor é a lei.
- Componentes shadcn (`Form`, `FormField`, `FormMessage`). Nada de CSS solto: só tokens do Tailwind/tema.
- Falhas do servidor: mapeie `codigo` → mensagem por i18n (`t('erros.MECANICO_OCUPADO')`) e `campo` → `form.setError(campo, ...)`. Um código desconhecido cai numa mensagem genérica com `traceId`.
- Botão de envio desabilitado durante o envio (evita duplo clique), `aria-busy`, foco no primeiro erro.
- A UI **esconde** ações sem permissão (`pode('os:iniciar')`), mas isso é cosmético: o servidor sempre valida.
- Toda lista tem os estados vazio, carregando (skeleton) e erro. Toda ação destrutiva tem confirmação.
- Texto sempre por chave de i18n, mesmo com um idioma só (facilita adicionar idiomas depois).

## Template
```tsx
'use client';
export function PausarOsForm({ osId }: { osId: string }) {
  const t = useTranslations('oficina');
  const form = useForm<PausarOs>({ resolver: zodResolver(pausarOsSchema), defaultValues: { osId, motivo: '' } });
  const onSubmit = form.handleSubmit(async (dados) => {
    const r = await pausarOsAction(dados);
    if (!r.ok) return aplicarFalhas(form, r.falhas, t);   // helper shared
    toast.success(t('os.pausada'));
  });
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} aria-busy={form.formState.isSubmitting}>
        <FormField name="motivo" control={form.control} render={({ field }) => (
          <FormItem><FormLabel>{t('os.motivoPausa')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting}>{t('os.pausar')}</Button>
      </form>
    </Form>
  );
}
```

## Testes
- Unitário do schema (válidos e inválidos).
- **Playwright E2E** do fluxo principal do módulo, incluindo a exibição de um erro de regra vindo do servidor e a ausência de ações sem permissão.
- Verificação de acessibilidade com `@axe-core/playwright` nas telas novas.
