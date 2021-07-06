wget https://github.com/joaovizoso/arms_docker/archive/refs/heads/main.zip
unzip main.zip
rm main.zip
mv arms_docker-main/workflow workflow
rm -r arms_docker-main

sed 's/numpy==1.20.1/numpy==1.19.5/'  workflow/requirements.txt > workflow/requirements.tmp
mv workflow/requirements.tmp workflow/requirements.txt