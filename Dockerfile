services:
  - type: web
    name: compilers1
    env: docker
    dockerfilePath: Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
