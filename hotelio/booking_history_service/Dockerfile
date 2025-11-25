FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --no-audit --no-fund
COPY src ./src
ENV PORT=9094
EXPOSE 9094
CMD ["node","src/index.js"]