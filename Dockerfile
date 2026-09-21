FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .
RUN npm run build

FROM nginx:alpine AS final

COPY --chmod=644 nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chmod=755 /app/out /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
