# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=18.18.2

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app


################################################################################
# Create a stage for installing production dependecies.
FROM base as prod-deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.yarn to speed up subsequent builds.
# Leverage bind mounts to package.json and yarn.lock to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=cache,target=/root/.yarn \
    yarn install --production --frozen-lockfile

################################################################################
# Create a stage for installing production dependecies.
FROM base as all-deps

# Copy the rest of the source files into the image.
COPY . .
RUN yarn install --frozen-lockfile

################################################################################
# Create a stage to run application in development mode.
FROM all-deps as dev

# Run the build script.
CMD yarn run dev

################################################################################
# Create a stage to run test client for integration testing.
FROM all-deps as test
# Run the build script.
CMD yarn run test --forceExit --integration=true

################################################################################
# Create a stage for building the application.
FROM all-deps as build

ENV API_SECRET="mySecretKey"
ENV BEARER_EXPIRES_IN="1h"
ENV DB_HOST="mongo"
ENV DB_PORT="27017"
ENV DB_USER="root"
ENV DB_PASSWORD="example"

# Run the build script.
RUN yarn run test --forceExit --mockDB=true
RUN yarn run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base as prod

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as a non-root user.
RUN chown node /usr/src/app
USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the prod-deps stage and also
# the built application from the build stage into the image.
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build


# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD yarn start
