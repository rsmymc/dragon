# ---------- Base ----------
FROM node:20-bullseye AS base
WORKDIR /app
COPY package*.json ./

# ---------- Dev (Vite hot reload) ----------
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 5173
# Use compose command to run: npm run dev -- --host 0.0.0.0 --port 5173
