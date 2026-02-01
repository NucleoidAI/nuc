#!/bin/bash

# mcp.sh - Script to view MCP server database entities

if [ $# -lt 2 ]; then
    echo "Usage:"
    echo "  $0 [server_name] view              - View all entities"
    echo "  $0 [server_name] [entity_name] view - View specific entity"
    exit 1
fi

SERVER_NAME=$1
DB_PATH="mcp/$SERVER_NAME/db/database.json"

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# Check if jq is installed for JSON parsing
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    echo "Install it with: apt-get install jq (Debian/Ubuntu) or yum install jq (CentOS/RHEL)"
    exit 1
fi

# Case 1: View all entities - mcp.sh [server_name] view
if [ $# -eq 2 ] && [ "$2" == "view" ]; then
    echo "=== All entities in $SERVER_NAME ==="
    jq '.' "$DB_PATH"
    exit 0
fi

# Case 2: View specific entity - mcp.sh [server_name] [entity_name] view
if [ $# -eq 3 ] && [ "$3" == "view" ]; then
    ENTITY_NAME=$2
    echo "=== Entity: $ENTITY_NAME in $SERVER_NAME ==="
    
    # Try to find the entity (supports both array and object structures)
    RESULT=$(jq --arg entity "$ENTITY_NAME" '.[$entity] // .[] | select(.name == $entity or .id == $entity)' "$DB_PATH")
    
    if [ -z "$RESULT" ]; then
        echo "Error: Entity '$ENTITY_NAME' not found in $DB_PATH"
        exit 1
    fi
    
    echo "$RESULT" | jq '.'
    exit 0
fi

# Invalid usage
echo "Invalid usage. Use 'view' as the last argument."
echo "Usage:"
echo "  $0 [server_name] view              - View all entities"
echo "  $0 [server_name] [entity_name] view - View specific entity"
exit 1