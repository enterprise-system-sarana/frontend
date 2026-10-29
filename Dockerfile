FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://169.58.63.127:3333/api/v1
ARG VITE_ACCESS_TOKEN_KEY=access_token
ARG VITE_REFRESH_TOKEN_KEY=refresh_token
ARG VITE_USER_KEY=auth_user

ENV VITE_API_URL=$VITE_API_URL \
    VITE_ACCESS_TOKEN_KEY=$VITE_ACCESS_TOKEN_KEY \
    VITE_REFRESH_TOKEN_KEY=$VITE_REFRESH_TOKEN_KEY \
    VITE_USER_KEY=$VITE_USER_KEY

RUN npm run build
RUN npm install -g serve

EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]