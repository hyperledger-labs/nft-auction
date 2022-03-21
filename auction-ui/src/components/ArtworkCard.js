/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import CountdownTimer from './CountdownTimer.js';
import { API_ENDPOINT } from '../services/Constants.js';

class ArtworkCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuctionClosed: false,
    };
  }

  renderAuctionItem() {
    let { isAuctionClosed } = this.state;
    let { id, nftId, itemDetail, itemDescription, itemImageName, itemStatus, isAuction, buyItNowPrice, closeDate } = this.props;
    return (
      <div className="col-md-6 col-lg-4">
        <div className={"card artwork-card mb-4 " + (isAuctionClosed ? 'artwork-card-disabled' : '')}>
          <img className="card-img-top" src={`${API_ENDPOINT}/images/${itemImageName}`} alt='Artwork' />
          <div className="watermark watermark-thumb"></div>
          <div className="card-body">
            <h5 className="card-title">{itemDetail}</h5>
            <p className="card-text text-muted">{itemDescription && `${itemDescription.substring(0, 100)}...`}</p>
            {isAuction && <p><small>Buy It Now: </small><strong>${parseInt(buyItNowPrice, 10).toLocaleString()}</strong></p>}
            <div className="d-flex justify-content-between align-items-center">
              {isAuction && !isAuctionClosed && <button onClick={() => this.props.handleClick(id, nftId)} type="button" className={"btn btn-sm btn-outline-" + (isAuction ? 'danger' : 'primary')} data-toggle="modal" data-target=".art-detail-modal">Bid</button>}

              {/* <div className="btn-group">
                {!isAuction && itemStatus === 'INITIAL' && <button onClick={() => this.props.handleClick(id,nftId)} type="button" className="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target=".submit-artwork-auction-modal">Submit for Auction</button>}
                {!isAuction && itemStatus === 'INITIAL' && <button onClick={() => this.props.handleClick(id,nftId)} type="button" className="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target=".transfer-artwork-modal">Transfer</button>}
              </div> */}
              {/* {itemStatus === 'READYFORAUC' && <span className="badge badge-info">At Auction</span>} */}
              {isAuction && !isAuctionClosed && <h1><CountdownTimer endDate={closeDate} handleCloseAuction={() => this.setState({ isAuctionClosed: true })} /></h1>}
              {isAuction && isAuctionClosed && <span className="badge badge-danger">CLOSED</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  //nft or auction
  render() {
    let { isAuctionClosed } = this.state;
    let { item, nfts, isAuction, id } = this.props;

    //render Auction
    if (isAuction) {
      return this.renderAuctionItem();
    }

    //render nft
    return (
      <div className='col-md-6 col-lg-4'>
        {nfts.map((nft, idx) => {
          return <div id={"nft-" + idx} key={idx} className={"card artwork-card mb-4 " + (isAuctionClosed ? 'artwork-card-disabled' : '')}>
            <img className="card-img-top" src={`${API_ENDPOINT}/images/${item.itemImageName}`} alt='Artwork' />
            <div className="watermark watermark-thumb"></div>
            <div className="card-body">
              <h5 className="card-title">{item.itemDetail}</h5>
              <p className="card-text text-muted">{item.itemDescription && `${item.itemDescription.substring(0, 100)}...`}</p>
              <div className="d-flex justify-content-between align-items-center">
                <button onClick={() => this.props.handleClick(id, nft.nftId, idx)} type="button" className="btn btn-sm btn-outline-primary" data-toggle="modal" data-target=".art-detail-modal">View</button>
                <div className="btn-group">
                  {nft.nftStatus === 'INITIAL' && <button onClick={() => this.props.handleClick(id, nft.nftId, idx)} type="button" className="btn btn-sm btn-outline-success" data-toggle="modal" data-target=".submit-artwork-auction-modal">Submit for Auction</button>}
                  {nft.nftStatus === 'INITIAL' && <button onClick={() => this.props.handleClick(id, nft.nftId, idx)} type="button" className="btn btn-sm btn-outline-dark" data-toggle="modal" data-target=".transfer-artwork-modal" >Transfer</button>}
                </div>
                {nft.nftStatus === 'READYFORAUC' && <span className="badge badge-info" >At Auction</span>}
              </div>
            </div>
          </div>
        })}
      </div>
    );
  }
}

export default ArtworkCard;
