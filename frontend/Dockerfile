FROM node:16.4-slim

WORKDIR /app
COPY . .
ENV PATH /app/node_modules/.bin:$PATH

RUN yarn install
