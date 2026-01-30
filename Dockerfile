# Multi-stage Dockerfile for Claude Transcript Viewer
# Builds both frontend and backend in a single image with npm workspaces

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Copy workspace package files
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies (this installs for all workspaces)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./frontend/

# Build frontend for production
RUN npm run build:frontend

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Copy workspace package files
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies (this installs for all workspaces)
RUN npm ci

# Copy backend source code
COPY backend/ ./backend/

# Build backend TypeScript
RUN npm run build:backend

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Copy workspace package files
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install production dependencies only for all workspaces
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend static files to backend public directory
COPY --from=frontend-builder /app/frontend/dist ./backend/dist/public

# Expose port 3000
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "backend/dist/index.js"]
