FROM node:alpine
RUN apk update
RUN apk add chromium
RUN apk add chromium-chromedriver
COPY . /app
WORKDIR /app
CMD npm install && npm install -g typescript && node --version && npm --version && npm run build && npm run start
