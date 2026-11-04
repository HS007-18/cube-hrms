FROM nginx:alpine

# Copy the built frontend applications
COPY dist /usr/share/nginx/html/company
COPY dist-super-admin /usr/share/nginx/html/super-admin

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]