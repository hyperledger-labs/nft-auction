/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

class BlockchainBlock extends Component {

  dataTimeouts = [];

  constructor(props) {
    super(props);
    this.state = {
      isCreated: false,
    };
  }

  componentDidMount() {
    this.dataTimeouts.push(setTimeout(() => {
      this.setState({ isCreated: true }) //After 1 second, set render to true
    }, 2000)
    );

    $(function () {
      $('[data-toggle="popover"]').popover();
    });
  }

  componentWillUnmount() {
    if (this.dataTimeouts.length) {
      this.dataTimeouts.forEach(st => clearTimeout(st));
    }
    this.dataTimeouts = [];
  }

  render() {
    return <li
      className={"blockchain-block " + (this.state.isCreated ? 'blockchain-block-added' : '')}
      data-toggle="popover"
      data-placement="top"
      title={`Block ID: ${this.props.id}`}
      data-trigger="hover"
      data-html="true"
      data-content={`<ul class="p-0"><li class="block small text-truncate">ID: ${this.props.transactionId}</li><li class="block small">Timestamp: ${this.props.timestamp}</li><li class="block small">Creator: ${this.props.creatorId}</li></ul>`}>
      {this.props.id}
    </li>;
  }
}

export default BlockchainBlock;
