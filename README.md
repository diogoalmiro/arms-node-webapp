# ARMS Node Webapp

Simple application to manage and ocr tif files.

# Set up docker image (once)

Without downloading any files run the following command: 
```
$ docker build -t arms-node-webapp github.com/diogoalmiro/arms-node-webapp#main
```

To create the image on your local files run on the root folder of this project:
```
$ docker build -t arms-node-webapp-container .
```

# Run container

On the docker desktop:

 - Define the name of the container
 - port:80
 - Add a volume:
   - Host Path: Create a folder and select it (This folder will contain the uploads and results)
   - Container Path: `/home/app/persist`
 - Run

On the terminal:
```
$ docker run --name arms-node-webapp-image -p 80:8005 -v "$(pwd)"/persist:/home/app/persist --env "DEBUG=webfocus:*" -d arms-node-webapp-container
```

