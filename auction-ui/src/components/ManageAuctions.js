/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';

import AuctionTableRow from './AuctionTableRow.js';
import OpenAuction from './OpenAuction.js';

import AuctionService from '../services/Auctions.js';
import { SITE_NAME } from '../services/Constants.js';
import { toast } from 'react-toastify';
import BlockchainExplorer from './BlockchainExplorer.js';

class ManageAuctions extends Component {

  constructor(props) {
    super(props);

    this.state = {
      auctionRequests: [],
      openAuctions: [],
      selectedAuction: {},
      isLoadingAuctionRequests: false,
      isLoadingOpenAuctions: false,
      newRequestCount: 0,
    };

    this.auctions = new AuctionService();

    this.getAuctions = this.getAuctions.bind(this);
    this.handleCloseAuction = this.handleCloseAuction.bind(this);
    this.updateAuctionStatus = this.updateAuctionStatus.bind(this);
    this.updateOnSocketMessage = this.updateOnSocketMessage.bind(this);
    this.reloadAuctions = this.reloadAuctions.bind(this);

    document.title = SITE_NAME + ": Manage Auctions";
  }

  componentDidMount() {
    this.getAuctions();
  }

  updateOnSocketMessage() {
    this.setState({ newRequestCount: 0 });

    // @todo review
    // let { newRequestCount } = this.state;
    // if (!this.state.isLoadingAuctionRequests && !this.state.isLoadingOpenAuctions) {
    //   this.setState({ newRequestCount: ++newRequestCount });
    // }
  }

  reloadAuctions() {
    if (!this.state.isLoadingAuctionRequests && !this.state.isLoadingOpenAuctions) {
      this.getAuctions();
    }
    this.setState({ newRequestCount: 0 });
  }

  getAuctions() {
    this.setState({
      auctionRequests: [],
      openAuctions: [],
      isLoadingAuctionRequests: true,
      isLoadingOpenAuctions: true,
    });
    this.auctions.getAuctionRequestsForCurrentAuctionHouse().then((response => {
      this.setState({
        selectedAuction: response[0],
        auctionRequests: response,
        isLoadingAuctionRequests: false,
      });
    })).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
    this.auctions.getOpenAuctions().then((response => {
      this.setState({
        openAuctions: response,
        isLoadingOpenAuctions: false,
      });
    })).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  updateAuctionStatus(auctionId) {
    let indexOfAuctionToUpdate = this.state.openAuctions.findIndex((auction) => auction.auctionID === auctionId);
    let openAuctions = this.state.openAuctions;
    let auctionToUpdate = openAuctions[indexOfAuctionToUpdate];
    auctionToUpdate.status = "CLOSED";
    openAuctions[indexOfAuctionToUpdate] = auctionToUpdate;
    this.setState({ openAuctions });
  }

  handleCloseAuction(auctionId) {
    let auctionToClose = { auctionID: auctionId };
    this.auctions.closeAuction(auctionToClose).then((response => {
      this.updateAuctionStatus(auctionId);
    })).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  renderOpenAuctions() {
    let { isLoadingOpenAuctions, openAuctions } = this.state;
    if (isLoadingOpenAuctions) {
      return <AuctionTableRow />
    }
    return openAuctions.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp)).map((openAuction, i) => <AuctionTableRow id={i} {...openAuction} key={i} handleCloseAuction={this.handleCloseAuction} />);
  }

  renderAuctionRequests() {
    let { isLoadingAuctionRequests, auctionRequests } = this.state;
    if (isLoadingAuctionRequests) {
      return <AuctionTableRow />
    }
    return auctionRequests.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp)).map((auctionRequest, i) => <AuctionTableRow id={i} handleClick={(auctionId) => { this.setState({ selectedAuction: auctionRequests[auctionId] }) }} {...auctionRequest} handleCloseAuction={this.handleCloseAuction} key={i} />);
  }

  render() {
    let noRecordsFound = !this.state.isLoadingAuctionRequests && !this.state.isLoadingOpenAuctions
      && !this.state.auctionRequests.length && !this.state.openAuctions.length;

    return (
      <div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6 mb-3">
              <h1 className="title text-primary">Manage Auctions</h1>
            </div>
            {this.state.newRequestCount > 0 && <div className="col-md-6 mb-3 d-flex align-items-center justify-content-end">
              <button type="button" className="btn btn-primary my-auto" onClick={this.reloadAuctions} data-toggle="tooltip" title="Click here to load new request.">
                Refresh <span className="badge badge-danger">{this.state.newRequestCount}</span>
              </button>
            </div>}
          </div>
          <table className="table auctionTable table-hover text-center">
            <thead>
              <tr>
                <th scope="col">Artwork</th>
                <th scope="col">Auction ID</th>
                <th scope="col">NFT ID</th>
                <th scope="col">Seller ID</th>
                <th scope="col">Status</th>
                <th scope="col">Reserve Price</th>
                <th scope="col">Buy-It-Now Price</th>
                <th scope="col">Request Date / Timeleft</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {this.renderOpenAuctions()}
              {this.renderAuctionRequests()}
              {noRecordsFound && <tr className="auction">
                <td colSpan="9" className="text-center text-info">No information found.</td>
              </tr>}
            </tbody>
          </table>
        </div>
        <OpenAuction {...this.state.selectedAuction} refreshAuctions={this.getAuctions} />
        <BlockchainExplorer onSocketMessage={this.updateOnSocketMessage} />
      </div>
    );
  }
}

export default ManageAuctions;
