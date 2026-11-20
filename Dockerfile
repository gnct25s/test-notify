FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /test-notice

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER node
CMD ["npm", "run", "discord"]
