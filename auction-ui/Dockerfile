FROM node:14.19.3

ARG USR=node
#RUN useradd -u 8877 ${USR}

WORKDIR /opt/ui

COPY . /opt/ui

RUN chown -R ${USR}:${USR} /opt/ui
RUN npm install 

USER ${USR}

EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]