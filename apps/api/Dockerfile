FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install

COPY prisma ./prisma
COPY apps/api ./apps/api

RUN npm run db:generate
RUN npm --workspace apps/api run build

EXPOSE 3000

CMD ["npm", "--workspace", "apps/api", "run", "start"]
