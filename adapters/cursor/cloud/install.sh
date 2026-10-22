#!/usr/bin/env bash
# Executado pelo Cursor Cloud ao criar o Build. Deve ser idempotente.
# Fase 1–2: não há código ainda, nada a instalar. Da Fase 3 em diante, o agente acrescenta aqui
# o comando de dependências do perfil (ex.: "npm ci", "dotnet restore", "./gradlew --version").
set -euo pipefail
npm install -g @fission-ai/openspec@latest >/dev/null 2>&1 || true
if [[ -f package-lock.json ]]; then npm ci; fi
if compgen -G "*.slnx" >/dev/null || compgen -G "*.sln" >/dev/null; then dotnet restore; fi
if [[ -f mobile/gradlew ]]; then (cd mobile && ./gradlew --no-daemon help >/dev/null); fi
