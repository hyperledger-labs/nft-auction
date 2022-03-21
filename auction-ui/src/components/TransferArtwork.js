/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

import { SpinnerButton } from './Spinner.js';

import ArtworkService, { ArtworkCancelPromise } from '../services/Artwork.js';
import UtilsService from '../services/Utils.js';
import { toast } from 'react-toastify';
import validator from 'validator';


class TransferArtwork extends Component {
  dataLoader = [];

  constructor(props) {
    super(props);
    this.state = {
      artwork: {},
      transfereeUsername: '',
      isLoading: false,
    };
    this.artwork = new ArtworkService();
    this.utils = new UtilsService();
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.nftID && props.nftID !== state.prevNftID) {
      return {
        artwork: {},
        transfereeUsername: '',
        isLoading: false,
        prevNftID: props.nftID,
      }
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
    if (nftID && !Object.keys(this.state.artwork).length) {
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
    }
  }

  componentWillUnmount() {
    if (this.dataLoader.length) {
      this.dataLoader.forEach(d => {
        ArtworkCancelPromise.getArtworkWithId = true;
      });
    }
    this.dataLoader = [];
  }

  handleChange(event) {
    const target = event.target;
    const value = validator.escape(target.value);
    this.setState({ transfereeUsername: value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ isLoading: true });
    let transfer = {
      nftId: this.props.nftID,
      ownerAESKey: this.state.artwork.nft.aesKey,
      transferee: this.state.transfereeUsername,
      itemImage: this.state.artwork.nft.itemImage,
    };
    this.artwork.transferArtworkToUser(transfer).then((response) => {
      this.setState({ isLoading: false });
      this.props.handleTransfer();
      $('#transferArtworkModal').modal('hide');
      toast.dismiss();
      toast.success(`Artwork transferred to ${this.state.transfereeUsername} successfully.`);
      
    }).catch(err => {
      toast.dismiss();
      toast.error(err);
    });
  }

  renderContent() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="mb-3">
          <label htmlFor="reservePrice">Transfer to user</label>
          <input className="form-control" placeholder="Type username here" type="text" name="transfereeUsername" value={this.state.transfereeUsername} onChange={this.handleChange} required />
          <div className="text-danger small" role="alert">
            Transfer this artwork to another user without payment.
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-2">
          Transfer Artwork
          {this.state.isLoading && <SpinnerButton />}
        </button>
      </form>
    );
  }

  render() {
    let { itemDetail } = { ...this.props["item"] };
    return (
      <div id="transferArtworkModal" className="modal fade transfer-artwork-modal" tabIndex="-1" role="dialog" aria-labelledby="transferArtwork" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Transfer &quot;{itemDetail}&quot;</h5>
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

export default TransferArtwork;
