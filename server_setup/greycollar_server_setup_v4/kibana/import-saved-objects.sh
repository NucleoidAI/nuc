#!/bin/bash

KIBANA_URL="${KIBANA_URL:-http://kibana:5601}"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "Waiting for Kibana to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -s "${KIBANA_URL}/api/status" | grep -q '"level":"available"'; then
        echo "Kibana is ready!"
        break
    fi
    echo "Attempt $i/$MAX_RETRIES - Kibana not ready yet, waiting ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

echo "Importing saved objects..."

RESPONSE=$(curl -s -X POST "${KIBANA_URL}/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    -F "file=@/saved-objects/saved-objects.ndjson")

echo "Import response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "Saved objects imported successfully!"
else
    echo "Warning: Import may have had issues. Check the response above."
fi

echo "Data views setup complete."
