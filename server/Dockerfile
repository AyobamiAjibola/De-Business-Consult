# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.8.0

# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Create a stage for installing production dependencies.
FROM base as deps

# Copy package.json and yarn.lock for installing dependencies.
COPY package.json yarn.lock ./

# Install production dependencies.
RUN yarn install --production

# Create a stage for building the application.
FROM deps as build

# Install all dependencies, including devDependencies.
RUN yarn install

# Copy the rest of the source files into the image.
COPY . .

# Run the build script.
RUN yarn run build

# Create a new stage to run the application with minimal runtime dependencies.
FROM base as final

# Use production node environment by default.
ENV NODE_ENV development

# Run the application as a non-root user.
USER node

# Install nodemon globally
RUN yarn global add nodemon

# Copy only the necessary files from the deps and build stages.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build

# Ensure necessary directories and files are copied.
COPY ./src/helpers/serviceAccount.json /usr/src/app/build/helpers/
COPY ./logs /usr/src/app/logs

# If needed, copy .env file or use environment variables.
COPY .env .env

# Copy package.json and yarn.lock to final image for running scripts
COPY package.json yarn.lock ./

# Expose the port that the application listens on.
EXPOSE 5050

# Run the application using the appropriate start command.
CMD ["yarn", "start:dev"]