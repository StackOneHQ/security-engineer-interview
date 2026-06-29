FROM node:22-slim

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

RUN npm run seed

EXPOSE 4000
CMD ["npm", "start"]
