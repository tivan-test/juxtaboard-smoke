# Образ для прогона автотестов без агента: смоук → регресс → удаление пространства → отчёт в runs/.
# Версия образа Playwright = установленной версии @playwright/test (bun.lock): браузеры внутри образа подходят ей.
FROM mcr.microsoft.com/playwright:v1.64.1-noble

# bun фиксированной версии (та же, что у разработчиков)
COPY --from=oven/bun:1.4.4 /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx

# Даты в отчёте и имя папки runs/<дата> — по Москве
ENV TZ=Europe/Moscow

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# Параметры после имени сервиса передаются скрипту: docker compose run --rm tests -- -g "SM-03 "
ENTRYPOINT ["bun", "scripts/run.ts"]
CMD []
