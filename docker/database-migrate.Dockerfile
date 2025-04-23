FROM node:18

WORKDIR /app

COPY ./packages/database/package.json ./
COPY ./packages/database/prisma ./prisma/

RUN npm install

CMD ["npx", "prisma", "migrate", "dev", "--name", "init"]
