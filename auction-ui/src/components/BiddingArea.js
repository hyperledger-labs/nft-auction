/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

import AuctionsAPI, { AuctionsCancelPromise } from '../services/Auctions.js';
import { toast } from 'react-toastify';
import validator from 'validator';
import { SpinnerButton } from './Spinner.js';
import CountdownTimer from './CountdownTimer.js';

class BiddingArea extends Component {

  constructor(props) {
    super(props);
    this.state = {
      highestBid: '',
      bidPrice: '',
      reservePrice: this.props.reservePrice,
      closeDate: this.props.closeDate,
      isAuctionClosed: false,
      message: '',
      interval: '',
      isMakingBid: false,
      isBuyingNow: false,
    };
    this.auctions = new AuctionsAPI();
    this.handleMakeBid = this.handleMakeBid.bind(this);
    this.handleBuyNow = this.handleBuyNow.bind(this);
  }

  componentDidMount() {
    this.getHighestBid();
    let interval = setInterval(() => this.getHighestBid(), 20000);
    this.setState({ interval });

    $('#artworkDetailModal').on('hidden.bs.modal', function (event) {
      if(document.getElementById("formBid")) {
        document.getElementById("formBid").reset();
      }
    }); 
  }

  componentWillUnmount() {
    clearInterval(this.state.interval);
    //cancel promise 
    AuctionsCancelPromise.getHighestBidForAuctionWithId = true;
  }

  getHighestBid() {
    this.auctions.getHighestBidForAuctionWithId(this.props.auctionId).then(response => {
      this.setState({
        highestBid: response.bidPrice,
      });
    }).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  handleMakeBid(event) {
    event.preventDefault();
    this.setState({ isMakingBid: true });
    let bid = {
      bidPrice: this.state.bidPrice,
      auctionID: this.props.auctionId,
    };
    this.auctions.makeBid(bid).then(response => {
      if (response.message) {
        this.setState({
          message: response.message,
          isMakingBid: false,
        });

        toast.dismiss();
        toast.success(response.message);

      } else {
        this.setState({
          message: '',
          bidPrice: '',
          highestBid: response.bidPrice,
          isMakingBid: false,
        });
        toast.dismiss();
        toast.success("Bid submitted successfully.");
      }
      document.getElementById("formBid").reset();
    })
      .catch(err => {
        this.setState({ isMakingBid: false });
        document.getElementById("formBid").reset();
        toast.dismiss();
        toast.error(err);
      });
  }

  handleBuyNow(event) {
    event.preventDefault();
    this.setState({ isBuyingNow: true });
    let bid = {
      bidPrice: this.props.buyItNowPrice,
      auctionID: this.props.auctionId,
    };
    this.auctions.buyNow(bid).then(response => {
      if (!response.message.includes('successfully')) {
        this.setState({
          message: response.message,
          isBuyingNow: false,
        });
        toast.dismiss();
        toast.err(response.message);

      } else {
        this.props.closeAuction();
        toast.dismiss();
        toast.success("Buynow submitted successfully.");
      }
    }).catch(err => {
      this.setState({ isBuyingNow: false });
      toast.dismiss();
      toast.error(err);
    });
  }

  render() {
    let { highestBid } = this.state;
    let { reservePrice } = this.props;
    let priceLimitMin = parseInt(highestBid) || parseInt(reservePrice) || 0;

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6">
            <div className="jumbotron">
              <p><small>Current bid: </small><strong>US ${parseInt(highestBid || 0, 10).toLocaleString()}</strong></p>
              <small className="text-muted">Bid ends in <CountdownTimer endDate={this.state.closeDate} handleCloseAuction={() => this.setState({ isAuctionClosed: true })} /></small>
              <form id="formBid" onSubmit={this.handleMakeBid}>
                <div className="form-group">
                  <label htmlFor="bidPrice">Enter ${parseInt(priceLimitMin, 10).toLocaleString()} or more</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">$</div>
                    </div>
                    <input type="number" className="form-control" placeholder="Bid Amount" min={priceLimitMin} value={this.state.bidPrice} onChange={(e) => this.setState({ bidPrice: validator.escape(e.target.value) })} required autoFocus />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={this.state.isMakingBid || this.state.isAuctionClosed}>
                  Make Bid
                  {this.state.isMakingBid && <SpinnerButton />}
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-6">
            <div className="jumbotron">
              <p><small>Price: </small><strong>${parseInt(this.props.buyItNowPrice, 10).toLocaleString()}</strong></p>
              <form onSubmit={this.handleBuyNow}>
                <button type="submit" className="btn btn-danger" disabled={this.state.isBuyingNow || this.state.isAuctionClosed}>
                  Buy It Now
                  {this.state.isBuyingNow && <SpinnerButton />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BiddingArea;
