#!/bin/bash

# Actualizar version.json con timestamp actual antes del build
VERSION=$(node -e "console.log(require('./package.json').version)")
TIMESTAMP=$(node -e "console.log(Date.now())")

cat > public/version.json <<EOF
{
  "version": "$VERSION",
  "timestamp": $TIMESTAMP
}
EOF

echo "Version updated: $VERSION at $TIMESTAMP"
