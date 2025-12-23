FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Create sessions directory with proper permissions
RUN mkdir -p /app/sessions && chmod 755 /app/sessions

EXPOSE 4000

CMD ["npm", "start"]