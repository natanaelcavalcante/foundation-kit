# Ambiente do Cursor Cloud Agent para projetos do Foundation Kit.
# Base comum aos 3 perfis: Docker (para docker compose e Testcontainers), Node LTS, oathtool (gerar TOTP nos testes de MFA).
# Na Fase 2, o agente acrescenta a toolchain do perfil escolhido (bloco PERFIL abaixo) e registra em ADR.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git sudo unzip jq oathtool fuse-overlayfs iptables gnupg \
 && rm -rf /var/lib/apt/lists/*

# Docker Engine + compose plugin (o daemon sobe pelo "start" do environment.json).
# iptables-legacy evita problemas de Docker dentro de outra camada de container.
RUN install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" > /etc/apt/sources.list.d/docker.list \
 && apt-get update && apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-compose-plugin \
 && update-alternatives --set iptables /usr/sbin/iptables-legacy \
 && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/docker && echo '{"storage-driver":"fuse-overlayfs"}' > /etc/docker/daemon.json

# Node.js LTS (web-nextjs, Angular do enterprise-dotnet, ferramentas como OpenSpec)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

# ---- PERFIL (descomente na Fase 2 conforme o perfil aprovado) ----
# enterprise-dotnet:
# RUN curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir /usr/share/dotnet \
#  && ln -s /usr/share/dotnet/dotnet /usr/local/bin/dotnet
# mobile-kotlin (build/teste JVM; emulador Android não roda aqui — E2E do app fica no CI ou local):
# RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk-headless && rm -rf /var/lib/apt/lists/*

# Usuário não-root com acesso ao Docker
RUN useradd -m -s /bin/bash ubuntu 2>/dev/null || true \
 && usermod -aG docker ubuntu && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu
USER ubuntu
