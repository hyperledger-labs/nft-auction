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
import { toast } from 'react-toastify';
import validator from 'validator';

class OpenAuction extends Component {

  constructor(props) {
    super(props);

    this.auctions = new AuctionService();

    this.state = {
      isLoading: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    let auction = { ...this.state.auction }
    auction[name] = validator.escape(value);
    this.setState({ auction });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ isLoading: true });
    let auction = { ...this.state.auction };
    auction.auctionStartDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    auction.auctionRequestID = this.props.auctionID;
    this.auctions.openAuctionForBids(auction).then((response) => {
      this.setState({ isLoading: false });
      this.props.refreshAuctions();
      $('#openAuctionModal').modal('hide');
      toast.dismiss();
      toast.success("Auction started successfully.");
      
    }).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  renderContent() {
    return (
      <div className="row">
        <div className="col-md-12">
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="duration">Duration (Minutes)</label>
              <input type="number" className="form-control" name="duration" onChange={this.handleChange} required />
              <small className="form-text text-muted">Enter the auction duration in minutes.</small>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Begin Auction
              {this.state.isLoading && <SpinnerButton />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div id="openAuctionModal" className="modal fade open-auction-modal" tabIndex="-1" role="dialog" aria-labelledby="openAuction" aria-hidden="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLongTitle">Open Auction</h5>
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

export default OpenAuction;
