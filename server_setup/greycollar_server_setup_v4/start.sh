#!/bin/bash

# GreyCollar Server Startup Script

echo "========================================="
echo "GreyCollar Server Setup"
echo "========================================="
echo ""

echo "Stopping existing containers..."
docker compose down

echo ""
echo "Pulling latest images (this may take a few minutes)..."
docker compose pull

echo ""
echo "Starting services..."
docker compose up -d --force-recreate

echo ""
echo "========================================="
echo "Services started successfully!"
echo "========================================="
docker compose ps

echo ""
echo "To view logs, run: docker compose logs -f"
echo "To stop services, run: docker compose down"
