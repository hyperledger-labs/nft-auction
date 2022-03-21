/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';

import emptyAuctions from '../assets/no-auction-listing.png';

import ArtworkCard from './ArtworkCard.js';
import ArtworkDetail from './ArtworkDetail.js';
import NewArtwork from './NewArtwork.js';
import SubmitArtworkAuction from './SubmitArtworkAuction.js';
import TransferArtwork from './TransferArtwork.js';
import Spinner from './Spinner.js';

import ArtworkService from '../services/Artwork.js';
import AuctionService from '../services/Auctions.js';
import { SITE_NAME } from '../services/Constants';
import { toast } from 'react-toastify';
import BlockchainExplorer from './BlockchainExplorer';

class ArtworkGrid extends Component {

  openedSockets = null;

  constructor(props) {
    super(props);
    this.state = {
      yourArtwork: [],
      openAuctions: [],
      selectedArtwork: {},
      selectedNft: {},
      nftID: null,
      nftIndex: null,
      isBidding: false,
      isLoadingYourArtwork: true,
      isLoadingOpenAuctions: true,
      isShowingAllOpenAuctions: false,
      isViewingArtwork: false,
      isNewSocketMessage: false,
      newNotificationCount: 0,
    };

    this.artwork = new ArtworkService();
    this.auctions = new AuctionService();

    this.addArtworkToState = this.addArtworkToState.bind(this);
    this.getYourArtwork = this.getYourArtwork.bind(this);
    this.getAllOpenAuctions = this.getAllOpenAuctions.bind(this);
    this.updateOnSocketMessage = this.updateOnSocketMessage.bind(this);
    this.reloadAuctions = this.reloadAuctions.bind(this);

    document.title = SITE_NAME + ": Dashboard";
  }

  componentDidMount() {
    this.getAllOpenAuctions();
    this.getYourArtwork();
  }

  componentWillUnmount() {
    //Empty on purpose
  }

  getYourArtwork() {
    this.setState({ isLoadingYourArtwork: true });
    this.artwork.getArtworkForCurrentUser().then(response => {
      this.setState({
        yourArtwork: response,
        selectedArtwork: response[0],
        isLoadingYourArtwork: false,
      });
    })
      .catch(err => {
        toast.dismiss();
        toast.error(err);
        this.setState({
          yourArtwork: [],
          selectedArtwork: {},
          isLoadingYourArtwork: false,
        });
      });
  }

  getAllOpenAuctions() {
    this.setState({ isLoadingOpenAuctions: true });
    this.auctions.getOpenAuctions().then(response => {
      this.setState({
        openAuctions: response,
        isLoadingOpenAuctions: false,
      });
    })
      .catch(err => {
        toast.dismiss();
        toast.error(err);
        this.setState({
          openAuctions: [],
          isLoadingOpenAuctions: false,
        });
      });
  }

  addArtworkToState(newArtwork) {
    let yourArtwork = this.state.yourArtwork;
    yourArtwork.push(newArtwork);
    this.setState({ yourArtwork });
  }

  updateOnSocketMessage() {
    this.setState({ newNotificationCount: 0 });

    //@todo review
    // let { newNotificationCount } = this.state;
    // if (!this.state.isLoadingOpenAuctions && !this.state.isLoadingYourArtwork) {
    //   this.setState({ newNotificationCount: ++newNotificationCount });
    // }
  }

  reloadAuctions() {
    if (!this.state.isLoadingOpenAuctions) {
      this.getAllOpenAuctions();
    }

    if (!this.state.isLoadingYourArtwork) {
      this.getYourArtwork();
    }
    this.setState({ newNotificationCount: 0 });
  }

  renderYourArtwork() {
    let { isLoadingYourArtwork, yourArtwork } = this.state;
    if (isLoadingYourArtwork) {
      return <Spinner />;
    }
    return (
      <div className="row mb-5">
        {!yourArtwork.length && <div className="col-md-6"><span className="alert alert-primary">No information found!</span></div>}
        {yourArtwork.sort((a, b) => new Date(b.item.timeStamp) - new Date(a.item.timeStamp)).map((art, i) => <ArtworkCard handleClick={(artworkIndex, nftID, nftIndex) => this.setState({ nftID: nftID, nftIndex: nftIndex, selectedNft: { ...yourArtwork[artworkIndex]["nfts"][nftIndex] }, selectedArtwork: yourArtwork[artworkIndex], isBidding: false, isViewingArtwork: true })} id={i} {...art} key={i} />)}
      </div>
    );
  }

  renderOpenAuctions() {
    let { isLoadingOpenAuctions, openAuctions, isShowingAllOpenAuctions } = this.state;
    if (isLoadingOpenAuctions) {
      return <Spinner />;
    }
    return (
      <div className="row">
        {openAuctions.length === 0 && <div className="col-md-6 col-lg-4"><img className="mb-4 mx-auto bg-primary" src={emptyAuctions} width="350" alt="Empty Auction" /></div>}
        {openAuctions.length > 0 && openAuctions.slice(0, isShowingAllOpenAuctions ? openAuctions.count : 3).map((auction, i) => <ArtworkCard isAuction handleClick={(artworkIndex, nftID) => this.setState({ nftID: nftID, selectedArtwork: openAuctions[artworkIndex], auctionID: openAuctions[artworkIndex]["auctionID"], buyItNowPrice: openAuctions[artworkIndex]["buyItNowPrice"], reservePrice: openAuctions[artworkIndex]["reservePrice"], closeDate: openAuctions[artworkIndex]["closeDate"], isBidding: true, isViewingArtwork: true })} id={i} {...auction} key={i} />)}
      </div>
    );
  }

  render() {
    let { selectedArtwork, isShowingAllOpenAuctions, isBidding, yourArtwork, openAuctions } = this.state;
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6 mb-3">
            <h1 className="title text-primary">Dashboard</h1>
          </div>
          {this.state.newNotificationCount > 0 && <div className="col-md-6 mb-3 d-flex align-items-center justify-content-end">
            <button type="button" className="btn btn-primary my-auto" onClick={this.reloadAuctions} data-toggle="tooltip" title="Click here to load new auctions.">
              Refresh <span className="badge badge-danger">{this.state.newNotificationCount}</span>
            </button>
          </div>}
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <h5 className="text-muted">Open Auctions ({openAuctions.length})</h5>
          </div>
          <div className="col-md-6">
            {openAuctions.length > 3 && <a className="float-right" href="#show" onClick={() => this.setState({ isShowingAllOpenAuctions: !this.state.isShowingAllOpenAuctions })}>{isShowingAllOpenAuctions ? 'Show less' : 'Show all'}</a>}
          </div>
        </div>
        {this.renderOpenAuctions()}
        <hr />
        <div className="row mb-3 mt-5">
          <div className="col-md-6">
            <h5 className="text-muted">Your Artwork ({yourArtwork.length})</h5>
          </div>
          <div className="col-md-6">
            <button className="btn btn-primary btn-sm float-right" type="button" data-toggle="modal" data-target=".new-artwork-modal">Add Artwork</button>
          </div>
        </div>
        {this.renderYourArtwork()}
        <ArtworkDetail nftID={this.state.nftID} isVisible={this.state.isViewingArtwork} isAuction={isBidding} auctionID={this.state.auctionID} buyItNowPrice={this.state.buyItNowPrice} reservePrice={this.state.reservePrice} closeDate={this.state.closeDate} handleCloseAuction={() => { this.getAllOpenAuctions(); this.getYourArtwork(); }} />
        <NewArtwork addArtwork={this.addArtworkToState} />
        <SubmitArtworkAuction nftID={this.state.nftID} nftIndex={this.state.nftIndex} selectedNft={this.state.selectedNft} updateArtwork={() => { this.getAllOpenAuctions(); this.getYourArtwork(); }} {...selectedArtwork} />
        <TransferArtwork nftID={this.state.nftID} handleTransfer={() => this.getYourArtwork()} {...selectedArtwork} />
        <div className="row"><BlockchainExplorer onSocketMessage={this.updateOnSocketMessage} /></div>
      </div>
    );
  }

}

export default ArtworkGrid;

