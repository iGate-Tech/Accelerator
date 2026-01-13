#!/bin/bash

# Generate self-signed SSL certificates for development
# Run this script from the project root

mkdir -p ssl

echo "Generating self-signed SSL certificates for development..."

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Clean up CSR file
rm ssl/cert.csr

echo "SSL certificates generated in ssl/ directory"
echo "Set SSL_KEY_PATH and SSL_CERT_PATH environment variables to use them"
echo ""
echo "Example:"
echo "SSL_KEY_PATH=/app/ssl/key.pem"
echo "SSL_CERT_PATH=/app/ssl/cert.pem"