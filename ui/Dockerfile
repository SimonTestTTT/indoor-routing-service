FROM node:alpine

# Better caching
COPY ./package-lock.json /app/package-lock.json

COPY ./package.json /app/package.json

WORKDIR /app

RUN npm i --legacy-peer-deps

RUN npm install -g serve


COPY . /app

RUN npm run build

ENTRYPOINT ["serve", "-s", "build"]