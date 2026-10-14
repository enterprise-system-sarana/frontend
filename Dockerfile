FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api/v1
ARG VITE_ACCESS_TOKEN_KEY=access_token
ARG VITE_REFRESH_TOKEN_KEY=refresh_token
ARG VITE_USER_KEY=auth_user

ENV VITE_API_URL=$VITE_API_URL \
    VITE_ACCESS_TOKEN_KEY=$VITE_ACCESS_TOKEN_KEY \
    VITE_REFRESH_TOKEN_KEY=$VITE_REFRESH_TOKEN_KEY \
    VITE_USER_KEY=$VITE_USER_KEY

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
