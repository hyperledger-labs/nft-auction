/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import logo from '../assets/logo.png';

export const API_SOCKET_ENDPOINT = 'ws://localhost:3001';
export const API_ENDPOINT = 'http://localhost:3001';
export const API_ENDPOINT_USERLOGIN = API_ENDPOINT + '/user/login';
export const API_ENDPOINT_USERREGISTER = API_ENDPOINT + '/user/register';
export const API_ENDPOINT_GETUSER_ITEMS = API_ENDPOINT + '/nft/me';
export const API_ENDPOINT_GETITEM_BYID = (nftID) => API_ENDPOINT + `/nft/${nftID}`; 
export const API_ENDPOINT_GETITEM_HISTORY_BYID = (nftID) => API_ENDPOINT + `/nft/${nftID}/history`; 
export const API_ENDPOINT_ADDITEM = API_ENDPOINT + '/nft/mint';
export const API_ENDPOINT_ITEM_TRANSFER = API_ENDPOINT + '/nft/transfer';
export const API_ENDPOINT_ADDAUCTION_ITEM = API_ENDPOINT + '/auction/init'; 
export const API_ENDPOINT_GETAUCTION_ITEMS = API_ENDPOINT + '/auction/init';
export const API_ENDPOINT_ADDAUCTION_OPEN_ITEM = API_ENDPOINT + '/auction/open'; 
export const API_ENDPOINT_GETAUCTION_OPEN_ITEMS = API_ENDPOINT + '/auction/open';
export const API_ENDPOINT_ADDBID = API_ENDPOINT + '/bid';
export const API_ENDPOINT_GETHIGHBID_BYID = (auctionId) => API_ENDPOINT + `/bid/high/${auctionId}`; 
export const API_ENDPOINT_BID_BUYNOW = API_ENDPOINT + '/bid/buyNow';
export const API_ENDPOINT_AUCTION_CLOSE = API_ENDPOINT + '/auction/close';


export const CURRENT_USER = () => JSON.parse(localStorage.getItem('user')) || {};
export const HEADERS = () => new Headers({ 'content-type': 'application/json', 'cache-control': 'no-cache', 'x-access-token': CURRENT_USER().accessToken });
export const AJAXHEADERS = { 'content-type': 'application/json', 'cache-control': 'no-cache', 'x-access-token': CURRENT_USER().accessToken };

export const SITE_NAME = "NFT Workshop";
export const SITE_LOGO = logo;
export const REQUESTDATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const MAX_FILEUPLOAD_SIZE = "2";//in mb

      