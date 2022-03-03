FROM python:3.8.0

RUN apt-get update && apt-get install gcc-arm-linux-gnueabihf

WORKDIR /api
COPY . .
RUN python -m pip install -r requirements.txt
