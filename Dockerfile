# ==========================================
# Stage 1: Build Environment
# ==========================================
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci --only=production=false

# Copy remaining source files
COPY . .

# Build production static bundle
RUN npm run build

# ==========================================
# Stage 2: Production Serving Environment
# ==========================================
FROM nginx:1.25-alpine AS production-stage

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Add container healthcheck instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
