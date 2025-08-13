# Use Node.js as the base image
FROM node:18.15.0-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci
# Copy the app's source code to the container
COPY . .

# Build the React app
RUN npx expo export --platform web

# Serve the build
EXPOSE 8080
CMD ["npx", "serve", "-s", "dist", "-l", "8080"]
