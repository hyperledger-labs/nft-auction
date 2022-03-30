/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';
import Sockette from 'sockette';

import BlockchainBlock from './BlockchainBlock.js';
import { API_SOCKET_ENDPOINT } from '../services/Constants.js';

class BlockchainExplorer extends Component {

  openedSockets = null;

  constructor(props) {
    super(props);
    this.state = {
      blocks: [],
    };
    this.handleNewBlockCreated = this.handleNewBlockCreated.bind(this);
  }

  componentDidMount() {
    this.setupWebSocket();
    $(function () {
      $('[data-toggle="popover"]').popover()
    });
  }

  componentWillUnmount() {
    if (this.openedSockets) {
      this.openedSockets.close();
    }
    this.openedSockets = null;
  }

  setupWebSocket() {
    this.openedSockets = new Sockette(API_SOCKET_ENDPOINT, {
      timeout: 5e3,
      maxAttempts: 10,
      onmessage: e => this.handleNewBlockCreated(e),
    });
  }

  handleNewBlockCreated(block) {
    const parsedBlock = JSON.parse(block.data);
    let newBlock = {
      id: parsedBlock.block_id,
      transactionId: parsedBlock.txs[0].tx_id,
      timestamp: parsedBlock.txs[0].timestamp,
      creatorId: parsedBlock.txs[0].creator_msp_id,
    };
    let blocks = this.state.blocks;

    //display 15 blocks
    if (blocks.length == 15) {
      blocks.splice(0, 1);
    }
    blocks.push(newBlock);

    this.setState({ blocks });
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    //@todo review
    //this.props.onSocketMessage();
  }

  render() {
    let { blocks } = this.state;
    return (
      <div className={"blockchain-explorer " + (blocks.length > 0 ? 'blockchain-explorer-visible' : '')}>
        <div className="container-fluid">
          <div className="row">
            <ul className="list-inline">
              {blocks.length > 0 && blocks.map((block, i) => <BlockchainBlock key={i} {...block} />)}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default BlockchainExplorer;
