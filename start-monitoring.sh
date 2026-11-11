#!/bin/bash

# nuc Event Monitoring Stack Startup Script
echo "🚀 Starting nuc Event Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing monitoring containers..."
docker-compose -f docker-compose.monitoring.yml down

# Pull latest images
echo "📥 Pulling latest monitoring images..."
docker-compose -f docker-compose.monitoring.yml pull

# Start the monitoring stack
echo "🔄 Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Checking service status..."
if docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
    echo "✅ Monitoring stack started successfully!"
    echo ""
    echo "🔗 Access your dashboards:"
    echo "   📈 Grafana: http://localhost:3006 (admin/admin)"
    echo "   🎯 Prometheus: http://localhost:9090"
    echo ""
    echo "📊 Event Publishing Analytics Dashboard:"
    echo "   Dashboard URL: http://localhost:3006/d/event-publishing-analytics"
    echo ""
    echo "💡 Make sure your nuc API is running on port 4000 to see metrics!"
    echo ""
    echo "🔄 To stop the monitoring stack, run:"
    echo "   docker-compose -f docker-compose.monitoring.yml down"
else
    echo "❌ Failed to start monitoring stack. Check logs with:"
    echo "   docker-compose -f docker-compose.monitoring.yml logs"
    exit 1
fi