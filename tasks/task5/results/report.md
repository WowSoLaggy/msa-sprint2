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
