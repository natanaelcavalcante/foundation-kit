---
name: armazenamento-seguro
description: Implementa ou revisa o armazenamento seguro no app (perfil mobile-kotlin) — Android Keystore para chaves não-exportáveis, Tink/AEAD para tokens e segredos, Room cifrado com SQLCipher, limpeza no logout, sem backup e sem logs sensíveis. Usar ao guardar tokens, dados pessoais ou qualquer segredo no dispositivo.
---

# Armazenamento seguro (app)

- `core:security/ArmazenamentoSeguro`: AEAD do **Tink** com keyset protegido por uma chave mestra do **Android Keystore** (`AndroidKeysetManager` + `masterKeyUri`); grava blobs cifrados no DataStore. Interface: `salvar(chave, valor)`, `ler(chave)`, `apagarTudo()`. (Evite `EncryptedSharedPreferences`/`security-crypto`: foi descontinuado pelo Google.)
- Chave do banco: 32 bytes aleatórios gerados na primeira execução, guardados pelo `ArmazenamentoSeguro`, passados ao `SupportOpenHelperFactory` do SQLCipher.
- Prefira o StrongBox quando disponível (`setIsStrongBoxBacked(true)`, com fallback).
- `android:allowBackup="false"` e `dataExtractionRules` excluindo tudo. Nada sensível em `cacheDir` sem cifra.
- Nunca grave senha. O código TOTP nunca é guardado. Os códigos de recuperação só são exibidos, nunca persistidos no app.
- Root/emulador detectado (Play Integrity): registre e informe o backend (que decide), sem bloquear às cegas.

## Testes
Instrumentados: round-trip, `apagarTudo` remove tudo, o arquivo do banco não contém texto claro (abrir os bytes e procurar um valor conhecido), e a chave do Keystore não é exportável.
