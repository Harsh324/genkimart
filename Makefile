DEV_ENV_FILE = env/.env.dev
COMPOSE_FILE = deploy/compose.dev.yml
OVERRIDE_FILE = deploy/override.yml

COMPOSE_OVERRIDE_ARG = $(if $(wildcard $(OVERRIDE_FILE)),-f $(OVERRIDE_FILE),)

up:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) up -d

down:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) down

restart: down up
