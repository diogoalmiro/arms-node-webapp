# ARMS Node Webapp

Simple application to manage and ocr tif files.

# Set up docker container (once)

```
$ docker build -t arms-node-webapp-container .
```

# Run container

```
$ docker run --name arms-node-webapp-image -p 80:8005 -v "$(pwd)"/persist:/home/app/persist --env "DEBUG=webfocus:*" -d arms-node-webapp-container
```

