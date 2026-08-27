ARG NODE_VERSION=24
FROM docker.arvancloud.ir/node:${NODE_VERSION}-alpine AS deps

RUN apk add --no-cache \
    --repository=https://mirror.arvancloud.ir/alpine/v3.20/main \
    libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm config set registry https://package-mirror.liara.ir/repository/npm/  && \
    npm cache clean --force && \
    npm ci --legacy-peer-deps



FROM docker.arvancloud.ir/node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM docker.arvancloud.ir/node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER nextjs

EXPOSE 3005

CMD ["npm", "start"]
