FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN npm install --save-dev

# Bundle app source
COPY . .
RUN pwd
RUN ls

RUN ["chmod", "+x", "/usr/src/app/gulp/server.js"]
RUN npm install -g gulp
RUN npm install gulp

EXPOSE 8080
CMD ["gulp", "serve"]
