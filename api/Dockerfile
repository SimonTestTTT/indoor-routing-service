FROM node:alpine

# Better caching
COPY ./package-lock.json /app/package-lock.json

COPY ./package.json /app/package.json

WORKDIR /app

RUN npm i

COPY . /app


RUN npm run build

ENTRYPOINT ["npm", "run", "run"]