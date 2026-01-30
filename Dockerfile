# Multi-stage Dockerfile for Claude Transcript Viewer
# Builds both frontend and backend in a single image

# Stage 1: Install all dependencies (using workspace)
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./

# Copy workspace package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies using workspace
RUN npm ci

# Stage 2: Build Frontend
FROM dependencies AS frontend-builder

WORKDIR /app

# Copy frontend source code
COPY frontend/ ./frontend/

# Build frontend for production
RUN cd frontend && npm run build

# Stage 3: Build Backend
FROM dependencies AS backend-builder

WORKDIR /app

# Copy backend source code
COPY backend/ ./backend/

# Build backend TypeScript
RUN cd backend && npm run build

# Stage 4: Production Image
FROM node:20-alpine

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./

# Copy workspace package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install production dependencies only using workspace
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend static files to public directory
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
