#!/bin/bash

# Скрипт для тестирования CI/CD пайплайна с помощью gitlab-ci-local

echo "🚀 Запуск CI/CD пайплайна с gitlab-ci-local"
echo "=============================================="

# Убедимся что мы в правильной директории
cd "$(dirname "$0")"

# Проверяем что gitlab-ci-local установлен
if ! command -v gitlab-ci-local &> /dev/null; then
    echo "❌ gitlab-ci-local не найден. Установите его с помощью: npm install -g gitlab-ci-local"
    exit 1
fi

# Проверяем что Docker запущен
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен. Запустите Docker и попробуйте снова"
    exit 1
fi

# Проверяем что Minikube запущен
if ! minikube status &> /dev/null; then
    echo "❌ Minikube не запущен. Запустите Minikube с помощью: minikube start --driver=docker"
    exit 1
fi

# Проверяем что Helm установлен
if ! command -v helm &> /dev/null; then
    echo "❌ Helm не найден. Установите Helm"
    exit 1
fi

echo "✅ Все зависимости проверены"
echo ""

# Запуск отдельных стадий
echo "1️⃣ Запуск стадии build..."
gitlab-ci-local build

if [ $? -eq 0 ]; then
    echo "✅ Стадия build завершена успешно"
else
    echo "❌ Стадия build завершилась с ошибкой"
    exit 1
fi

echo ""
echo "2️⃣ Запуск стадии test..."
gitlab-ci-local test

if [ $? -eq 0 ]; then
    echo "✅ Стадия test завершена успешно"
else
    echo "❌ Стадия test завершилась с ошибкой"
    exit 1
fi

echo ""
echo "3️⃣ Запуск стадии deploy..."
gitlab-ci-local deploy

if [ $? -eq 0 ]; then
    echo "✅ Стадия deploy завершена успешно"
else
    echo "❌ Стадия deploy завершилась с ошибкой"
    exit 1
fi

echo ""
echo "4️⃣ Запуск стадии tag..."
echo "Внимание: стадия tag настроена как manual, запуская принудительно..."
gitlab-ci-local tag

if [ $? -eq 0 ]; then
    echo "✅ Стадия tag завершена успешно"
else
    echo "❌ Стадия tag завершилась с ошибкой"
    exit 1
fi

echo ""
echo "🎉 Все стадии завершены успешно!"
echo ""
echo "Проверить развертывание можно следующими командами:"
echo "kubectl get deployment booking-service"
echo "kubectl get service booking-service"
echo "kubectl get pods -l app=booking-service"
echo ""
echo "Для тестирования сервиса локально:"
echo "kubectl port-forward svc/booking-service 8080:80"
echo "curl http://localhost:8080/ping"