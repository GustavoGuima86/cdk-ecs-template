# Use a specific platform for compatibility
FROM --platform=linux/amd64 nginx:latest

# Copy the custom index.html file
COPY index.html /usr/share/nginx/html/index.html

# Copy the custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf