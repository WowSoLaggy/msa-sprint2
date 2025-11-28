# Используем официальный минимальный образ Go
FROM golang:1.21-alpine

# TODO: Добавить необходимые пакеты (например, curl)
# Ожидаемый код:
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем Go-файл
COPY main.go .

# VERSION может быть v1 или v2. По умолчанию v1.
ARG VERSION=v1

# Выбираем нужный файл для сборки
RUN if [ "$VERSION" = "v2" ]; then \
      go build -o booking-service ./main_v2.go; \
    else \
      go build -o booking-service ./main_v1.go; \
    fi

# Открыть порт 8080
EXPOSE 8080

# TODO: Задать команду запуска
# Ожидаемый код:
CMD ["./booking-service"]
