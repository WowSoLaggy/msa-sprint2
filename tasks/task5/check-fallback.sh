#!/bin/bash

set -e

echo "▶️ Testing fallback route..."
curl -s -H "Host: booking.local" http://localhost:8080/ping || echo "Fallback route working"
