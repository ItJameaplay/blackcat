FROM ubuntu:21.10

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt -qqy upgrade && \
  apt install -qqy build-essential python3 cmake libfontconfig1 fontconfig curl bash libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

SHELL [ "/bin/bash", "-c" ]
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
  apt install nodejs && \
  npm install -g yarn && \
  fc-cache -fv && \
  groupadd -r cat && useradd --create-home --home /home/cat -r -g cat cat

COPY --chown=cat:cat . /home/cat
WORKDIR /home/cat
USER cat

RUN yarn install 

USER root
RUN apt remove -qqy build-essential python3 cmake libfontconfig1 fontconfig curl libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

USER cat

ENTRYPOINT [ "yarn", "start" ]