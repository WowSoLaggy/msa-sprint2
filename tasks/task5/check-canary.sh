#!/bin/bash

set -e

echo "▶️ Checking canary release (90% v1, 10% v2)..."

# Посылаем 100 запросов
for i in {1..100}
do
    curl -H "Host: booking.local" http://localhost:8080/ping && echo
done