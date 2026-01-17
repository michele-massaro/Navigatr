# syntax=docker/dockerfile:1

FROM node:alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

RUN --mount=type=bind,source=.,target=/context,readonly \
    if [ -f /context/nginx.conf ]; then \
    cp /context/nginx.conf /etc/nginx/conf.d/default.conf; \
    fi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
