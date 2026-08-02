# Dockerfile for deploying backend server to Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled build output
COPY dist ./dist

# Expose port 3000 (or PORT env provided by Cloud Run)
EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
