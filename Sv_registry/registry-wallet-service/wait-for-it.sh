#!/usr/bin/env bash
# wait-for-it.sh - borrowed minimal version
# Usage: wait-for-it.sh host:port -- command args

set -e

TIMEOUT=60
HOSTPORT="${1}"
shift || true

if [ -z "$HOSTPORT" ]; then
  echo "Usage: $0 host:port [-- command args]"
  exit 1
fi

HOST=$(echo "$HOSTPORT" | cut -d":" -f1)
PORT=$(echo "$HOSTPORT" | cut -d":" -f2)

echo "Waiting for $HOST:$PORT..."

for i in $(seq 1 $TIMEOUT); do
  (echo > /dev/tcp/${HOST}/${PORT}) >/dev/null 2>&1 && break || true
  sleep 1
done

# final check
(echo > /dev/tcp/${HOST}/${PORT}) >/dev/null 2>&1 || {
  echo "Timeout waiting for ${HOST}:${PORT}"
  exit 1
}

# if there are extra args, run them
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exit 0
