# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.12-slim
FROM python:${PYTHON_VERSION} AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_DIR=/app \
    VENV_DIR=/opt/venv \
    UV_PROJECT_ENVIRONMENT=/opt/venv
WORKDIR ${APP_DIR}
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libpq5 libmagic1 tini curl && \
    rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"
RUN uv --version
ARG APP_UID=10001
RUN useradd -u ${APP_UID} -m -d /home/appuser -s /usr/sbin/nologin appuser

FROM base AS deps
ARG UV_INCLUDE_DEV=0
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    if [ "$UV_INCLUDE_DEV" = "1" ]; then \
      uv sync --frozen --no-install-project --dev; \
    else \
      uv sync --frozen --no-install-project --no-dev; \
    fi && \
    find ${VENV_DIR} -name '__pycache__' -type d -exec rm -rf {} +

FROM base AS build
COPY --from=deps ${VENV_DIR} ${VENV_DIR}
ENV PATH="${VENV_DIR}/bin:${PATH}"
COPY . ${APP_DIR}
RUN python -c "import pkgutil, sys; assert pkgutil.find_loader('gunicorn'), 'gunicorn missing'"

FROM python:${PYTHON_VERSION} AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_DIR=/app \
    VENV_DIR=/opt/venv

# runtime-only OS deps
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libpq5 libjpeg62-turbo zlib1g libmagic1 curl ca-certificates tini && \
    rm -rf /var/lib/apt/lists/*

ARG APP_UID=10001
RUN useradd -u ${APP_UID} -m -d /home/appuser -s /usr/sbin/nologin appuser

WORKDIR ${APP_DIR}
COPY --from=build ${VENV_DIR} ${VENV_DIR}
COPY --from=build ${APP_DIR} ${APP_DIR}
ENV PATH="${VENV_DIR}/bin:${PATH}"

# Default bind mounts -> ensures staticfiels never ends up in images.
VOLUME ["/static", "/media"]

ENV HEALTHCHECK_URL="http://127.0.0.1:8000/api/catalog/products/"
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS "$HEALTHCHECK_URL" >/dev/null || exit 1

USER ${APP_UID}
ENV GUNICORN_CMD_ARGS="--config gunicorn.conf.py"
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["gunicorn", "config.wsgi:application"]
