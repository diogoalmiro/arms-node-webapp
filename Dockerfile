FROM ubuntu:18.04

RUN apt-get update \
    && apt-get install -y tesseract-ocr \
    python3 \
    python-setuptools \
    python3-pip \
    python3-venv \
    libtesseract-dev \
    libleptonica-dev \
    pkg-config \
    ffmpeg \
    libsm6 \
    libxext6  \
    curl \
    wget \
    zip \
    gnupg \
    && curl -sL https://deb.nodesource.com/setup_16.x  | bash - \
    && apt-get -y install nodejs \
    && apt-get clean \
    && apt-get autoremove 

WORKDIR /home/app

COPY ./ ./

RUN npm install

WORKDIR worker-threaded/workflow/exec/
RUN python3 -m venv env
RUN env/bin/pip3 install --upgrade pip && \
    env/bin/pip3 install opencv-python && \
	env/bin/pip3 install PyPDF2 && \
    env/bin/pip3 install pdf2image && \
    env/bin/pip3 install -r ../requirements.txt
WORKDIR ../../../

ENV LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    PORT=8005 \
    DEBUG=webfocus:*

EXPOSE 8005

CMD [ "npm", "start" ]

# DEBUG IN CONTAINER (EXPOSE  9229)
#RUN apt-get install -y sqlite3 vim
#ENV DEBUG=*

# setup (once)
# $ docker build -t node-arms .

# Run the following command to start the server
# exoses port 80 (http://localhost:80)
# folder persist is shared
# docker run -p 80:8005 -v "$(pwd)"/persist:/home/app/persist node-arms npm start
# $ docker run --name node-arms -p 80:8005 -p 9229:9229 -v "$(pwd)"/persist:/home/app/persist --env "DEBUG=webfocus:*" -d node-arms
