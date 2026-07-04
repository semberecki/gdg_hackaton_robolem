# Multi-stage Dockerfile for Angular Frontend in Nx Monorepo
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build the Angular frontend
RUN npx nx build frontend

# --- Production Nginx Stage ---
FROM nginx:alpine

# Copy custom nginx configuration to the templates folder for environment substitution
COPY apps/frontend/nginx.conf /etc/nginx/templates/default.conf.template

# Copy compiled static assets from builder
COPY --from=builder /usr/src/app/dist/apps/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
