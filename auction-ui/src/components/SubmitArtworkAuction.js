/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

import moment from 'moment';

import { SpinnerButton } from './Spinner.js';

import AuctionService from '../services/Auctions.js';
import { REQUESTDATE_FORMAT } from '../services/Constants.js';
import { toast } from 'react-toastify';
import validator from 'validator';

class SubmitArtworkAuction extends Component {

  constructor(props) {
    super(props);

    this.auctions = new AuctionService();

    this.state = {
      auction: {
        requestDate: moment().format(REQUESTDATE_FORMAT),
        auctionHouseID: "",
      },
      isLoading: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // $(".submit-success").hide();
  }

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    let auction = { ...this.state.auction };
    auction[name] = validator.escape(value);
    this.setState({ auction });
  }

  handleSubmit(event) {
    event.preventDefault();
    let auctionRequest = { ...this.state.auction };

    auctionRequest["nftId"] = this.props.nftID;
    auctionRequest["aesKey"] = this.props.selectedNft.aesKey,

      this.setState({ isLoading: true });
    this.auctions.createAuctionRequest(auctionRequest).then((response) => {
      this.setState({ isLoading: false });
      $('#submitArtworkModal').modal('hide');
      this.props.updateArtwork();

      toast.dismiss();
      toast.success("NFT item submitted to auction house successfully.");
      
    }).catch(err => {
      this.setState({ isLoading: false });
      toast.dismiss();
      toast.error(err);
    });
  }

  renderContent() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="mb-3">
          <label htmlFor="auctionHouseID">Auction House</label>
          <input className="form-control" type="text" name="auctionHouseID" placeholder="" onChange={this.handleChange} required />
        </div>
        <div className="mb-3">
          <label htmlFor="buytItNowPrice">Buy-It-Now Price</label>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">$</span>
            </div>
            <input className="form-control" type="number" name="buyItNowPrice" placeholder="Dollars" onChange={this.handleChange} required />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="reservePrice">Reserve Price</label>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">$</span>
            </div>
            <input className="form-control" type="number" name="reservePrice" max={this.state.auction.buyItNowPrice} placeholder="Dollars" onChange={this.handleChange} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-2">
          Submit Artwork for Auction
          {this.state.isLoading && <SpinnerButton />}
        </button>
      </form>
    );
  }

  render() {
    let { itemDetail } = { ...this.props["item"] };
    return (
      <div id="submitArtworkModal" className="modal fade submit-artwork-auction-modal" tabIndex="-1" role="dialog" aria-labelledby="submitArtwork" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Submit &quot;{itemDetail} - <small className="text-muted">{this.props.nftID}</small>&quot; for Auction</h5>

              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="container-fluid">
                {this.renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SubmitArtworkAuction;
