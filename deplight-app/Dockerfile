# Stage 1: Build React Frontend
FROM node:18-slim AS frontend-builder

WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build


# Stage 2: Build Backend & Serve
FROM node:18-slim

WORKDIR /usr/src/app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source code
COPY backend ./backend

# Copy the built React app from Stage 1
COPY --from=frontend-builder /usr/src/app/frontend/dist ./frontend/dist

# Environment settings
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start the Express server
WORKDIR /usr/src/app/backend
CMD ["node", "server.js"]
