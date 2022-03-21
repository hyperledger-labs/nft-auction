/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import moment from 'moment';
import $ from 'jquery';

import Spinner from './Spinner.js';
import CountdownTimer from './CountdownTimer.js';

import AuctionService, { AuctionsCancelPromise } from '../services/Auctions.js';
import { API_ENDPOINT, REQUESTDATE_FORMAT } from '../services/Constants.js';
import { toast } from 'react-toastify';

class AuctionTableRow extends Component {

  constructor(props) {
    super(props);
    this.state = {
      interval: [],
      highestBidForAuction: '',
      highestBidUsername: '',
    };
    this.auctions = new AuctionService();
    this.handleCloseAuction = this.handleCloseAuction.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.status === 'OPEN' && !state.interval) {
      return {
        interval: [],
        highestBidForAuction: '',
        highestBidUsername: '',
      };
    }
    return null;
  }

  componentDidMount() {
    if (this.props.status === 'OPEN' && !this.state.interval) {
      this.state.interval.push(
        setInterval(() => this.getHighestBidForAuction(), 5000)
      );
    }
    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.status === 'OPEN' && !this.state.interval) {
      this.state.interval.push(
        setInterval(() => this.getHighestBidForAuction(), 5000)
      );
    }
  }

  componentWillUnmount() {
    if (this.state.interval.length) {
      this.state.interval.forEach(int => {
        clearInterval(int);
      });
    }

    //cancel promise 
    AuctionsCancelPromise.getHighestBidForAuctionWithId = true;
  }

  getHighestBidForAuction() {
    this.auctions.getHighestBidForAuctionWithId(this.props.auctionID).then(response => {
      this.setState({
        highestBidForAuction: response.bidPrice,
        highestBidUsername: response.buyerID,
      });
    }).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  handleCloseAuction(auctionId) {
    if (this.state.interval.length) {
      this.state.interval.forEach(int => {
        clearInterval(int);
      });
    }
    //cancel promise 
    AuctionsCancelPromise.getHighestBidForAuctionWithId = true;

    this.props.handleCloseAuction(auctionId);
  }

  render() {
    let { id, auctionID, nftId, sellerID, itemImageName, status, buyItNowPrice, reservePrice, requestDate, closeDate } = this.props;
    let totalCols = $(".auctionTable th").length;
    if (!sellerID) {
      return (
        <tr className="auction">
          <td colSpan={totalCols} className="text-center"><Spinner /></td>
        </tr>
      );
    }
    return (
      <tr className="auction">
        <td id="itemImageName" className="artwork"><img src={`${API_ENDPOINT}/images/${itemImageName}`} width="100" height="100" alt="Artwork" /></td>
        <td id="auctionID">
          <div className="d-block text-truncate" data-toggle="tooltip" data-placement="top" title={auctionID}>{auctionID}</div>
        </td>
        <td id="nftId">
          <div className="d-block text-truncate" data-toggle="tooltip" data-placement="top" title={nftId}>{nftId}</div>
        </td>
        <td id="sellerID">{sellerID}</td>
        <td id="status"><span className={`badge badge-${status}`}>{status}</span></td>
        <td id="reservePrice">${parseInt(reservePrice, 10).toLocaleString()}</td>
        <td id="buyItNowPrice">${parseInt(buyItNowPrice, 10).toLocaleString()}</td>
        <td id="requestDate">
          {status === 'INIT' && moment(requestDate, REQUESTDATE_FORMAT).format('MM-DD-YYYY')}
          {status === 'OPEN' && <CountdownTimer auctionId={auctionID} endDate={closeDate} handleCloseAuction={this.handleCloseAuction} />}
          {status === 'CLOSED' && '-'}
        </td>
        <td id="action">
          {status === 'INIT' && <button type="button" className="btn btn-primary btn-sm" onClick={() => this.props.handleClick(id)} data-toggle="modal" data-target=".open-auction-modal">Open Auction</button>}
          {status === 'OPEN' &&
            <div>
              <strong>${this.state.highestBidUsername ? parseInt(this.state.highestBidForAuction, 10).toLocaleString() : '0'}</strong>
              <br />
              <small>{this.state.highestBidUsername}</small>
            </div>
          }
        </td>
      </tr>
    );
  }
}

export default AuctionTableRow;
