FROM nginx:1.27-alpine

# Copia todo el contenido estático
COPY . /usr/share/nginx/html

EXPOSE 80

# Salud simple
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O - http://localhost/ || exit 1
