#!/usr/bin/env bash
# Instala o Foundation Kit num projeto, baixando/atualizando o kit do GitHub (repositório privado).
# Uso:
#   bash <(gh api repos/natanaelcavalcante/foundation-kit/contents/scripts/novo-projeto.sh -H "Accept: application/vnd.github.raw") [destino] [--refactor]
#   ou, com o kit já clonado:  ~/.foundation-kit/scripts/novo-projeto.sh [destino] [--refactor]
set -euo pipefail
REPO="${FOUNDATION_KIT_REPO:-natanaelcavalcante/foundation-kit}"
CACHE="${FOUNDATION_KIT_DIR:-$HOME/.foundation-kit}"
VERSAO="${FOUNDATION_KIT_VERSION:-main}"   # branch ou tag (ex.: v1.0.0) para fixar a versão

if [[ -d "$CACHE/.git" ]]; then
  git -C "$CACHE" fetch -q --tags origin
  git -C "$CACHE" checkout -q "$VERSAO"
  git -C "$CACHE" pull -q --ff-only origin "$VERSAO" 2>/dev/null || true   # tags não têm pull
else
  if command -v gh >/dev/null 2>&1; then
    gh repo clone "$REPO" "$CACHE" -- -q
  else
    git clone -q "https://github.com/$REPO.git" "$CACHE"
  fi
  git -C "$CACHE" checkout -q "$VERSAO"
fi

echo "Foundation Kit $(git -C "$CACHE" describe --tags --always) em $CACHE"
exec "$CACHE/scripts/install.sh" "$@"
