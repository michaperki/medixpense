FROM node:18
WORKDIR /app
COPY ./apps/web/package.json ./
RUN npm install
COPY ./apps/web ./
CMD ["npm", "run", "dev"]
