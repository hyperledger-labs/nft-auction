/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import {
  API_ENDPOINT_GETUSER_ITEMS, API_ENDPOINT_GETITEM_BYID, API_ENDPOINT_GETITEM_HISTORY_BYID,
  API_ENDPOINT_ADDITEM, API_ENDPOINT_ITEM_TRANSFER,
  HEADERS
} from './Constants.js';
import { toast } from 'react-toastify';

export var ArtworkCancelPromise = {
  getArtworkWithId: false,
  getHistoryForArtworkWithId: false
};

export default class Artwork {

  getArtworkForCurrentUser() {
    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_GETUSER_ITEMS, {
        headers: HEADERS(),
        method: 'GET',
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        response.json().then(err=>{
          reject(err.message);
        }).catch(e=>{
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => resolve(data))
        .catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  getArtworkWithId(nftID) {
    ArtworkCancelPromise.getArtworkWithId = false;

    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_GETITEM_BYID(nftID), {
        headers: HEADERS(),
        method: 'GET',
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err=>{
          reject(err.message);
        }).catch(e=>{
          reject(response.statusText);
        });
        throw new Error(response.statusText);

      })
        .then(data => {
          if (!ArtworkCancelPromise.getArtworkWithId) {
            resolve(data);
          } else {
            reject({ message: "Canceled promise." })
          }
        })
        .catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  getHistoryForArtworkWithId(nftID) {
    ArtworkCancelPromise.getHistoryForArtworkWithId = false;

    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_GETITEM_HISTORY_BYID(nftID), {
        headers: HEADERS(),
        method: 'GET',
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err=>{
          reject(err.message);
        }).catch(e=>{
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => {
          if (!ArtworkCancelPromise.getHistoryForArtworkWithId) {
            resolve(data);
          } else {
            reject({ message: "Canceled promise." })
          }
        })
        .catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  createArtwork(newArtwork) {
    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_ADDITEM, {
        headers: HEADERS(),
        method: 'POST',
        body: JSON.stringify(newArtwork),
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err=>{
          reject(err.message);
        }).catch(e=>{
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => resolve(data))
        .catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

  transferArtworkToUser(artwork) {
    return new Promise(function (resolve, reject) {
      fetch(API_ENDPOINT_ITEM_TRANSFER, {
        headers: HEADERS(),
        method: 'POST',
        body: JSON.stringify(artwork),
      }).then(response => {
        if (response.status === 200) {
          return response.json();
        }
        //Error handler
        response.json().then(err=>{
          reject(err.message);
        }).catch(e=>{
          reject(response.statusText);
        });
        throw new Error(response.statusText);
      })
        .then(data => resolve(data))
        .catch(err => {
          toast.dismiss();
          toast.error(err);
        });
    });
  }

}
