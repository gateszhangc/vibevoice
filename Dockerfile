FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY assets ./assets
COPY index.html ./index.html
COPY robots.txt ./robots.txt
COPY script.js ./script.js
COPY server.js ./server.js
COPY site.webmanifest ./site.webmanifest
COPY sitemap.xml ./sitemap.xml
COPY styles.css ./styles.css

EXPOSE 3000

CMD ["node", "server.js"]

