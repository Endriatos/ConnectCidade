# Estágio 1: build do React
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_BUILD_TIME
ENV VITE_BUILD_TIME=$VITE_BUILD_TIME
ARG VITE_GIT_SHA
ENV VITE_GIT_SHA=$VITE_GIT_SHA
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_MAP_ID
ENV VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio 2: Nginx serve o build estático
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
