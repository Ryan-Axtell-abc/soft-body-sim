# Build stage
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN grep -A 3 '"node_modules/vite"' package-lock.json
RUN npm ci
RUN cat node_modules/vite/package.json | grep '"version"'
COPY . .
RUN cat node_modules/vite/package.json | grep '"version"'
RUN ./node_modules/.bin/vite build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80