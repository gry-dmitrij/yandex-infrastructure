FROM node:16.0
COPY src /src
COPY public /public
COPY package.json /package.json
COPY package-lock.json /package-lock.json
COPY tsconfig.json /tsconfig.json

RUN npm ci
RUN npm run build
