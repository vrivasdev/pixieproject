# stage 1
FROM ubuntu:latest as ubuntu
WORKDIR /app
RUN apt-get update -y
RUN DEBIAN_FRONTEND='noninteractive' apt-get install -y --no-install-recommends libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
RUN DEBIAN_FRONTEND='noninteractive' apt-get install -y --no-install-recommends nodejs
RUN DEBIAN_FRONTEND='noninteractive' apt-get install -y --no-install-recommends npm
COPY package.json ./
COPY . .
RUN npm update
RUN npm install
RUN npm install @angular-devkit/build-angular@0.13.0
RUN npm install --save --no-optional fabric
EXPOSE 4200
CMD npm run start