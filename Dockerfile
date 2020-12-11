FROM alpine:edge
RUN apk add --update nodejs npm openssl

# temporary fix for a vulnerability caused by the outdated Openssl version installed by default
RUN apk add --update openssl
RUN apk info openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci
COPY . .

EXPOSE 3001
CMD [ "npm", "start" ]
