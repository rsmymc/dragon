# ---------- base ----------
FROM node:20-bullseye AS base
WORKDIR /app
COPY package*.json ./

# ---------- dev (vite hot reload) ----------
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# ---------- build (production bundle) ----------
FROM base AS build
RUN npm ci
COPY . .
# (Vite bakes env at build-time; ensure .env.production is present)
RUN npm run build

# ---------- prod (nginx static serve) ----------
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
