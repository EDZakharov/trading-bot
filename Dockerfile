
ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine

RUN mkdir /app && chown node:node /app
WORKDIR /app

USER node
COPY --chown=node:node package.json package-lock.json* ./
COPY ./build ./app
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "npm", "start" ]
