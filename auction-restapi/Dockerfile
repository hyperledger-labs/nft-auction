#
# Copyright IT People Corporation. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
# Contributors: Surya Lanka
FROM node:14.19.3

ARG USR=node
WORKDIR /opt/api
COPY . /opt/api

RUN mkdir -p /opt/api/network/local/identities
RUN chown -R ${USR}:${USR} /opt/api
RUN npm install 

USER ${USR}

EXPOSE 3001
ENTRYPOINT ["npm", "run", "start"]
