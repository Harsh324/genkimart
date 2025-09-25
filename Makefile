DEV_ENV_FILE = env/.env.dev
COMPOSE_FILE = deploy/compose.dev.yml
OVERRIDE_FILE = deploy/override.yml

COMPOSE_OVERRIDE_ARG = $(if $(wildcard $(OVERRIDE_FILE)),-f $(OVERRIDE_FILE),)

include $(DEV_ENV_FILE)
export $(shell sed 's/=.*//' $(DEV_ENV_FILE))

up:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) up -d

down:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) down

restart: down up

db-shell:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) \
		exec $(DB_HOST) psql -U $(DB_USER) -d $(DB_NAME)

backend-shell:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) \
		exec backend bash

backend-logs:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) logs -f backend

frontend-logs:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) logs -f frontend

frontend-rebuild:
	docker compose --env-file $(DEV_ENV_FILE) -f $(COMPOSE_FILE) $(COMPOSE_OVERRIDE_ARG) up --build -d frontend