FROM node:18

WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--port", "8080"]
