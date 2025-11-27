# Описание изменений и решений

Подготовить образ `booking-service`:
```sh
cd tasks/task4/
docker build -t booking-service .
```

Запустить контейнер:
```sh
docker run --name booking-service \
  -p 8080:8080 \
  -e "ENABLE_FEATURE_X=true" \
  booking-service:latest
```
