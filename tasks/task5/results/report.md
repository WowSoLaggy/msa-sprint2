# Описание изменений и решений

## Запуск Istio

Запуск istio в minikube:
```sh
istioctl install --set profile=demo -y
```

Включение инъекций istio в каждый под в неймспейсе:
```sh
kubectl label namespace default istio-injection=enabled --overwrite
```

## Создание образов для разных версий

Собрать версию v1 (фича включается только по env-переменной):
```sh
docker build -t booking-service:v1 . --build-arg VERSION=v1
```

Собрать версию v2 (фича включается по заголовку в запросе):
```sh
docker build -t booking-service:v2 . --build-arg VERSION=v2
```

## Проверка разных версий приложения

Проверка версии v1:
```sh
curl localhost:8080/feature
```

Вывод будет содержать:
```sh
404 page not found
```

Проверка версии v2 (без заголовка):
```sh
curl localhost:8080/feature
```

Вывод будет содержать:
```sh
Feature X is disabled. Set header X-Feature-Enabled: true
```

Проверка версии v2 (с заголовком):
```sh
curl -H "X-Feature-Enabled: true" localhost:8080/feature
```

Вывод будет содержать:
```sh
Feature X is enabled via header!
```
