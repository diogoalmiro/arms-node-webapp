# ARMS Node Webapp

Simple application to manage and ocr tif files.

# Set up docker container (once)

```
$ docker build -t arms-node-webapp .
```

# Run container

```
$ docker run --name arms-node-webapp -p 80:8005 --add-host=arms.workflow:127.0.0.1 -v "$(pwd)"/persist:/home/app/persist --env "DEBUG=webfocus:*" -d node-arms npm start
```

