FROM node:18

WORKDIR /app

COPY ./apps/api/package.json ./
RUN npm install

COPY ./apps/api ./

CMD ["npm", "run", "dev"]
