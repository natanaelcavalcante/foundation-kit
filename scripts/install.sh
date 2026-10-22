#!/usr/bin/env bash
# Instala o Foundation Kit em um projeto (novo ou existente). Idempotente: não sobrescreve arquivos existentes.
set -euo pipefail
KIT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-.}"; MODE="new"; [[ "${2:-}" == "--refactor" ]] && MODE="refactor"
mkdir -p "$TARGET" && cd "$TARGET"

rsync -a --delete --exclude adapters --exclude scripts --exclude .git --exclude state.json --exclude VERSION --exclude node_modules --exclude bin --exclude obj --exclude build --exclude .gradle "$KIT/" .foundation/
echo "$(git -C "$KIT" rev-parse --short HEAD 2>/dev/null || echo dev)" > .foundation/VERSION

copy() { [[ -e "$2" ]] && echo "mantido: $2" || { mkdir -p "$(dirname "$2")"; cp "$1" "$2"; echo "criado:  $2"; }; }
copy "$KIT/AGENTS.md"                                 AGENTS.md
copy "$KIT/adapters/CLAUDE.md"                        CLAUDE.md
copy "$KIT/adapters/claude/skills/foundation/SKILL.md" .claude/skills/foundation/SKILL.md
copy "$KIT/adapters/cursor/rules/foundation.mdc"      .cursor/rules/foundation.mdc
copy "$KIT/adapters/cursor/cloud/environment.json"    .cursor/environment.json
copy "$KIT/adapters/cursor/cloud/Dockerfile"          .cursor/Dockerfile
copy "$KIT/adapters/cursor/cloud/install.sh"          .cursor/install.sh
mkdir -p docs/adr docs/bugs

if [[ ! -e .foundation/state.json ]]; then
  sed "s/\"mode\": \"new\"/\"mode\": \"$MODE\"/" "$KIT/protocol/state.example.json" > .foundation/state.json
  echo "criado:  .foundation/state.json (modo $MODE)"
fi
git rev-parse --git-dir >/dev/null 2>&1 || git init -q
echo; echo "Pronto. Abra seu agente e diga: \"Inicie o protocolo de fundação\"."
