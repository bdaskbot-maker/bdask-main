# ============================================
# BdAsk Backend - Dockerfile
# ============================================

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cache layer)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Create non-root user for security
RUN addgroup -g 1001 -S bdask && \
    adduser -S bdask -u 1001 -G bdask
USER bdask

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
