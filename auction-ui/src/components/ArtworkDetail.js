/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

import BiddingArea from './BiddingArea.js';
import Spinner from './Spinner.js';

import ArtworkAPI, { ArtworkCancelPromise } from '../services/Artwork.js';
import { API_ENDPOINT } from '../services/Constants.js';
import moment from 'moment';
import { toast } from 'react-toastify';


class ArtworkDetail extends Component {

  dataLoader = [];

  constructor(props) {
    super(props);
    this.state = {
      artwork: {},
      history: [],
      isLoading: true,
      isAuctionClosed: false,
      isVisible: props.isVisible
    };
    this.artwork = new ArtworkAPI();
    this.handleCloseAuction = this.handleCloseAuction.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.nftID && props.nftID !== state.prevNftID) {
      return {
        artwork: {},
        history: [],
        isLoading: true,
        isAuctionClosed: false,
        isVisible: props.isVisible,
        prevNftID: props.nftID,
      };
    }
    return null;
  }

  componentDidMount() {
    this.loadNftID(this.props.nftID);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!Object.keys(this.state.artwork).length) {
      this.loadNftID(this.props.nftID);
    }
  }

  loadNftID(nftID) {
    if (nftID && this.state.isVisible && !Object.keys(this.state.artwork).length) {
      this.dataLoader[0] = this.artwork.getArtworkWithId(nftID).then(response => {
        this.setState({
          artwork: response,
          isLoading: false,
        });
      }).catch(err => {
        toast.dismiss();
        toast.error(err);
        this.setState({
          artwork: {},
          isLoading: false,
        });
      });

      this.dataLoader[1] = this.artwork.getHistoryForArtworkWithId(nftID).then(response => {
        this.setState({
          history: response,
        });
      }).catch(err => {
        toast.dismiss();
        toast.error(err);
        this.setState({
          history: [],
        });
      });
    }
  }

  componentWillUnmount() {
    clearInterval(this.state.timeOut);
    if (this.dataLoader.length) {
      this.dataLoader.forEach(d => {
        ArtworkCancelPromise.getArtworkWithId = true;
        ArtworkCancelPromise.getHistoryForArtworkWithId = true;
      });
    }
    this.dataLoader = [];
  }

  handleCloseAuction() {
    this.setState({ isAuctionClosed: true });
    let timeOut = setTimeout(() => {
      this.props.handleCloseAuction();
      $('#artworkDetailModal').modal('hide');
    }, 2500);
    this.setState({ timeOut });
  }

  renderContent() {
    let { nftID, isAuction, auctionID, buyItNowPrice, reservePrice, closeDate } = this.props;
    let { item, nft } = this.state.artwork;
    if (this.state.isLoading) {
      return <Spinner />;
    }
    return (
      <div className="container-fluid">
        <div className="row">
          <div className={"col-md-12 " + (this.state.isAuctionClosed ? 'closed' : '')}>
            {!nft.aesKey && <div className="watermark watermark-full"></div>}
            {!nft.aesKey && <img className="img-stretch artwork-detail" src={`${API_ENDPOINT}/images/${item.itemImageName}`} alt='Artwork' />}
            {nft.aesKey && <img className="img-stretch artwork-detail" src={nft.itemImage} alt='Artwork' />}
          </div>
          <div className="col-md-12 mt-2 d-flex justify-content-between">
            {!isAuction && <h3>${parseInt(nft.price, 10).toLocaleString()}</h3>}
            <h3>NFTID: {nftID}</h3>
          </div>
          <div className="col-md-12 d-flex justify-content-between align-items-center">
            <div>
              <span className="badge badge-dark">{item.itemSubject}</span>
              <span className="badge badge-secondary ml-2">{item.itemType}</span>
              <span className="badge badge-info ml-2">{item.itemMedia}</span>
            </div>
            <div className="mt-2">Created on {item.itemDate}</div>
          </div>
          <div className="col-md-12">
            <span>Size <em>{item.itemSize}</em></span>
            <br />
            <hr />
            <p className="mt-2">{item.itemDescription}</p>
            <hr />
            <div className="row">
              <div className="col-md-12">
                <button className="btn btn-primary btn-sm mb-2" type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                  Show History
                </button>
                <div className="collapse" id="collapseExample">
                  <div className="list-group">
                    {this.state.history.map((historyItem, i) => <HistoryRow key={i} transactionId={historyItem.txID} timestamp={historyItem.timestamp} status={historyItem.nftStatus} ownerId={historyItem.ownerID} />)}
                  </div>
                </div>
              </div>
            </div>
            {/* {nft.aesKey && <div className="row mt-2">
              <div className="col-md-12">
                <small className="text-muted aes">AES Key: {nft.aesKey}</small>
              </div>
            </div>} */}
          </div>
          {isAuction && <div className="col-md-12"><BiddingArea nftID={nftID} auctionId={auctionID} buyItNowPrice={buyItNowPrice} reservePrice={reservePrice} closeDate={closeDate} closeAuction={this.handleCloseAuction} /></div>}
        </div>
      </div>
    );
  }

  render() {
    let { item } = { ...this.state.artwork };
    return (
      <div id="artworkDetailModal" className="modal fade art-detail-modal" tabIndex="-1" role="dialog" aria-labelledby="artDetail" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{item ? item.itemDetail : "Artwork Detail"}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              {this.renderContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ArtworkDetail;

const HistoryRow = function (props) {
  return (
    <li className="list-group-item flex-column align-items-start">
      <p className="mb-1">Artwork status was recorded as <span className="text-success">{props.status}</span> on the blockchain,<br/> with an owner <span className="text-danger">{props.ownerId} at {/*props.timestamp*/} {moment(String(props.timestamp).replace(' +','+').replace(' UTC','')).format('MM-DD-YYYY hh:mm:ss A')}</span></p>
      <small className="text-muted">{props.transactionId}</small>
    </li>
  );
}
