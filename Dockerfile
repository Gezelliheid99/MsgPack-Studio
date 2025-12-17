# Author: Pan Junjie
# Date: 2025-12-17
# Description: Dockerfile for building and serving the React application using Nginx

# Stage 1: Build the application
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (ignoring local package-lock.json to ensure platform compatibility)
RUN npm install

# Copy source code
COPY . .

# Build argument for API key
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
