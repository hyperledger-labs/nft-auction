/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import { API_ENDPOINT_USERLOGIN, API_ENDPOINT_USERREGISTER, HEADERS } from './Constants.js';
import { toast } from 'react-toastify';


export default class Users {
  userType = "TRD"; //AH-auction house, TRD- trader

  constructor() {
    this.currentUser();
  }

  login(user) {
    let selfUser = this; 
    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_USERLOGIN, {
        headers: HEADERS(),
        method: 'POST',
        body: JSON.stringify(user),
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err => {
          reject(err.message);
        }).catch(e => {
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => {
          localStorage.setItem('user', JSON.stringify(data));
          selfUser.setUserType(data);
          return resolve(data);
        }).catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  createNewUser(user) {
    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_USERREGISTER, {
        headers: HEADERS(),
        method: 'POST',
        body: JSON.stringify(user),

      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err => {
          reject(err.message);
        }).catch(e => {
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => {
          resolve(data);
        },
          (reason) => {
            toast.dismiss();
            toast.error(reason);
          }
        ).catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  //AH-auction house, TRD- trader
  setUserType(data) {
    this.userType = data['userType'] || "TRD";
    return this.userType;
  }

  currentUser() {
    let currentUser = JSON.parse(localStorage.getItem('user')) || {};
    this.setUserType(currentUser);
    return currentUser;
  }

  isUserLogin() {
    let currentUser = JSON.parse(localStorage.getItem('user')) || {};
    return currentUser['username'] ? true : false;
  }

}
