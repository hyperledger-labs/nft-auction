FROM node:14.19.3

ARG USR=node
#RUN useradd -u 8877 ${USR}

WORKDIR /opt/api

COPY . /opt/api

RUN chown -R ${USR}:${USR} /opt/api
RUN npm install 

USER ${USR}

EXPOSE 3001
ENTRYPOINT ["npm", "run", "start"]