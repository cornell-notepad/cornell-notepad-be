# Cornell Notepad - Back End

## Requirements
1. Node.js
2. Yarn
3. Docker

## Develop
```bash
yarn
docker compose -f ./docker-compose.yaml -f ./docker-compose.dev.yaml up --build
```
> server image rebuild and container restart is required on dependencies update

Swagger: http://127.0.0.1:3000/docs  
Mongo Express: http://127.0.0.1:8081 (username: `admin`, password: `pass`)

## Test
Same set of tests is used for unit, integration, and end-to-end testing:
- unit test: calls to external resources are mocked
- integration test: server is communicating with external resources during execution, tests are running on the same machine as the server and have access to its state (start and stop the server, controll DB connection, manipulate settings using environment variables, etc.)
- end-to-end test: MongoDB, server, and tests are running on different machines; tests simulate real client behaviour checking production build of the server
> - unit test is part of build process
> - end-to-end test is part of CI process
### Unit test
```bash
yarn
yarn test --mockDB=true
```
### Integration test
```bash
docker compose run server yarn test
```
### End to end test
```bash
docker compose -f ./docker-compose.yaml -f ./docker-compose.test.yaml up test-client --exit-code-from test-client
```

## Build and run
```bash
yarn
yarn build
yarn start
```

## Deploy
Application is delivered as [vitaliystorchous/cornell-notepad-be](https://hub.docker.com/r/vitaliystorchous/cornell-notepad-be) docker image. New versions are built and pushed to DockerHub on each merge to `main` branch.
