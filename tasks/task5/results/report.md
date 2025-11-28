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

Загрузить оба образа в minikube:
```sh
minikube image load booking-service:v1
minikube image load booking-service:v2
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

## Настройка istio

Применение файла настроек:
```sh
kubectl apply -f ./istio/booking.yml 
```

Вывод будет содержать:
```sh
deployment.apps/booking-v1 created
deployment.apps/booking-v2 created
service/booking created
destinationrule.networking.istio.io/booking-dr created
virtualservice.networking.istio.io/booking-vs created
```

Перезапуск деплоев, если образы были изменены:
```sh
kubectl -n default rollout restart deploy/booking-v1
kubectl -n default rollout restart deploy/booking-v2
kubectl -n default rollout status deploy/booking-v1
kubectl -n default rollout status deploy/booking-v2
```

Вывод будет:
```sh
kubectl -n default rollout restart deploy/booking-v2
kubectl -n default rollout status deploy/booking-v1
kubectl -n default rollout status deploy/booking-v2
deployment.apps/booking-v1 restarted
deployment.apps/booking-v2 restarted
Waiting for deployment "booking-v1" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "booking-v1" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "booking-v1" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "booking-v1" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "booking-v1" rollout to finish: 1 old replicas are pending termination...
deployment "booking-v1" successfully rolled out
deployment "booking-v2" successfully rolled out
```

## Пробрасывание порта

Пробросим порт 9090 на хост-машину:
```sh
kubectl -n default port-forward svc/booking 9090:9090
```
