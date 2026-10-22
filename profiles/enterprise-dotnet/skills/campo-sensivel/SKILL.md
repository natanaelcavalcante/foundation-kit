---
name: campo-sensivel
description: Aplica proteção a dados pessoais/sensíveis no perfil enterprise-dotnet — AES-256-GCM via ICifrador em ValueConverter do EF Core, coluna de blind index HMAC para busca, mascaramento no Serilog, exportação e anonimização LGPD. Usar sempre que a spec marcar um campo como sensível.
---

# Campo sensível (.NET)

1. Confirme a linha na tabela "Dados pessoais" da spec.
2. Implementação do `ICifrador` (Fase 3, `BuildingBlocks.Infrastructure`): `System.Security.Cryptography.AesGcm`, IV aleatório de 12 bytes, tag de 16, formato `v{n}:{iv}:{ct+tag}` (base64url, **igual ao web-nextjs**, o que permite migrar dados entre stacks); `HMACSHA256` com chave separada para o índice. As chaves vêm do Azure Key Vault/HashiCorp Vault ou de variáveis `CHAVE_MESTRA`/`CHAVE_INDICE` (32 bytes base64).
3. EF: `b.Property(x => x.Cpf).HasConversion(new CifradoConverter<Cpf>(cifrador, v => v.Valor, s => Cpf.Criar(s).Valor))` + `b.Property<string>("CpfIndice")` preenchida no `SaveChangesInterceptor` com `cifrador.IndiceCego(cpf.Valor)`; `HasIndex("TenantId", "CpfIndice").IsUnique()` quando for único.
4. Busca: `db.Clientes.Where(c => EF.Property<string>(c, "CpfIndice") == cifrador.IndiceCego(cpf.Valor))`.
5. Serilog: `Destructure.ByTransforming<Cpf>(_ => "[REDACTED]")` e um enricher que mascara propriedades nomeadas na lista de PII.
6. LGPD: implemente `IExportadorDadosPessoais` e `IAnonimizadorDadosPessoais` no módulo e registre-os no DI (o módulo `privacy` os descobre).
7. DTO mascarado por padrão; o valor completo só com permissão própria + auditoria.

## Testes
Leitura crua (Npgsql) não contém o valor; round-trip; a busca pelo índice funciona; um ciphertext adulterado → `AuthenticationTagMismatchException`; o log mostra `[REDACTED]`; exportação/anonimização.
