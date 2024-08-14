services:
  - type: web
    name: your-service-name
    env: docker
    dockerfilePath: Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
