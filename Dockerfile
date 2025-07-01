# ---- Build Stage ----
FROM node:20-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.env ./

# Create a non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e 'require("net").connect(3000).on("error", () => process.exit(1)).on("connect", () => process.exit(0))'

CMD ["node", "dist/main.js"]