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

Загрузить образ в minikube (так как Docker Hub недоступен):
```sh
minikube image load booking-service:latest
```

Проверка, что образ загрузился:
```sh
minikube image ls | grep booking-service
```

Ответ должен быть типа:
```sh
docker.io/library/booking-service:latest
```

Запускаем helm:
```sh
helm install booking-service ./helm/booking-service/
```

Или обновляем, если обновился образ (или до этого образ вообще не был найден):
```sh
helm upgrade booking-service ./helm/booking-service/
```

Проверка, что поды запустились:
```sh
kubectl get pods
```

Ответ должен быть вроде:
```sh
NAME                               READY   STATUS    RESTARTS   AGE
booking-service-65cd8fc857-8qqww   1/1     Running   0          4m47s
```

Пробросить порты на хост-машину:
```sh
kubectl port-forward deployment/booking-service 8080:8080 &
```

После чего проверка endpoints:
```sh
curl localhost:8080/ready
curl localhost:8080/ping
```
