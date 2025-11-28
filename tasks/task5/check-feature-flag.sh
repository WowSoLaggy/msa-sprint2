#!/bin/bash

set -e

echo "▶️ Проверка Feature Flag (X-Feature-Enabled: true)..."

# Отправляем запрос с заголовком, чтобы маршрутизировать трафик на `v2`
for i in {1..100}; do
  curl -s -H "Host: booking.local" -H "X-Feature-Enabled: true" http://localhost:8080/ping | grep -o 'v[12]';
done | sort | uniq -c
