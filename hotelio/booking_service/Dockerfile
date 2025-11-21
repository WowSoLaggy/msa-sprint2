FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --no-audit --no-fund
COPY proto ./proto
COPY src ./src
ENV PORT=9090
ENV HTTP_PORT=9091
EXPOSE 9090 9091
CMD ["npm","start"]
