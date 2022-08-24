#
# Copyright IT People Corporation. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
# Contributors: Surya Lanka

FROM node:14.19.3

ARG USR=node
WORKDIR /opt/ui
COPY . /opt/ui

RUN chown -R ${USR}:${USR} /opt/ui
RUN npm install 

USER ${USR}

EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]