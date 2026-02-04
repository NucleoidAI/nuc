#!/bin/bash

# mcp.sh - Script to view MCP server database entities

if [ $# -lt 2 ]; then
    echo "Usage:"
    echo "  $0 [server_name] view              - View all entities"
    echo "  $0 [server_name] [entity_name] view - View specific entity"
    exit 1
fi

SERVER_NAME=$1
CONTAINER_NAME="greycollar-land"
DB_PATH="/app/mcp/servers/$SERVER_NAME/db/database.json"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '$CONTAINER_NAME' is not running"
    exit 1
fi

# Check if database file exists inside container
if ! docker exec "$CONTAINER_NAME" test -f "$DB_PATH"; then
    echo "Error: Database file not found at $DB_PATH inside container"
    exit 1
fi

# Case 1: View all entities - mcp.sh [server_name] view
if [ $# -eq 2 ] && [ "$2" == "view" ]; then
    echo "=== All entities in $SERVER_NAME ==="
    docker exec "$CONTAINER_NAME" cat "$DB_PATH" | jq '.'
    exit 0
fi

# Case 2: View specific entity - mcp.sh [server_name] [entity_name] view
if [ $# -eq 3 ] && [ "$3" == "view" ]; then
    ENTITY_NAME=$2
    echo "=== Entity: $ENTITY_NAME in $SERVER_NAME ==="

    # Get the entity by key name
    RESULT=$(docker exec "$CONTAINER_NAME" cat "$DB_PATH" | jq --arg entity "$ENTITY_NAME" '.[$entity]')

    if [ -z "$RESULT" ] || [ "$RESULT" == "null" ]; then
        echo "Error: Entity '$ENTITY_NAME' not found in $DB_PATH"
        echo "Available entities:"
        docker exec "$CONTAINER_NAME" cat "$DB_PATH" | jq -r 'keys[]'
        exit 1
    fi

    echo "$RESULT"
    exit 0
fi

# Invalid usage
echo "Invalid usage. Use 'view' as the last argument."
echo "Usage:"
echo "  $0 [server_name] view              - View all entities"
echo "  $0 [server_name] [entity_name] view - View specific entity"
exit 1