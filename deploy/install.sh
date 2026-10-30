#!/usr/bin/env bash
# Установка на сервер (Linux): проверка Docker, .env, сборка образа и пробный прогон одного теста.
# Запуск из любой папки: bash deploy/install.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Нет docker. Установите Docker Engine: https://docs.docker.com/engine/install/" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Нет docker compose (плагин v2). Установите: https://docs.docker.com/compose/install/linux/" >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  echo "Создан .env из .env.example."
  echo "Заполните .env (JB_EMAIL, JB_PASSWORD) и запустите deploy/install.sh ещё раз."
  exit 1
fi

mkdir -p runs auth

echo "Сборка образа..."
docker compose build

echo "Пробный прогон одного теста (SM-03)..."
docker compose run --rm tests -- -g "SM-03 "

echo
echo "Готово. Отчёт пробного прогона — в последней папке runs/."
echo "Полный прогон: docker compose run --rm tests"

# Расписание пока не ставим. Пример на будущее (crontab -e), каждый день в 07:00:
# 0 7 * * * cd /opt/juxtaboard-smoke && docker compose run --rm tests >> runs/cron.log 2>&1
