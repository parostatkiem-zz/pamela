FROM alpine:3.12
RUN apk add --update nodejs npm openssl --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

WORKDIR /app

COPY package*.json ./

RUN npm ci
COPY . .

EXPOSE 3001
CMD [ "npm", "start" ]
