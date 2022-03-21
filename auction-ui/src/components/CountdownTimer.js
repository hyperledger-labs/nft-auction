/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import moment from 'moment';

class CountdownTimer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timeleft: 0,
      isAuctionClosed: false,
    };
  }

  countDownAuction() {
    let { auctionId, endDate, handleCloseAuction } = this.props;
    let { isAuctionClosed } = this.state;

    let isCloseDateInPast = moment.utc(endDate, "YYYY-MM-DD HH:mm:ss").isBefore(moment.utc());
    if (isCloseDateInPast && !isAuctionClosed) {
      this.setState({
        timeleft: '00:00',
        isAuctionClosed: true,
      });
      if (handleCloseAuction) {
        handleCloseAuction(auctionId);
      }
    }
    else if (!isAuctionClosed) {
      this.setState({ timeleft: this.getCoundownString(endDate) });
    }
  }

  getCoundownString(endDate) {
    let diff = moment.utc(endDate, "YYYY-MM-DD HH:mm:ss").diff(moment.utc());
    let duration = moment.duration(diff);
    let timerObj = {
      days: duration.days(),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds()
    };
    let pad = "00";
    let timer = "";
    if (timerObj.days) {
      timer += String("00" + timerObj.days).slice(-pad.length) + (timerObj.days > 1 ? " days " : " day ");
    }

    timer += "" + String("00" + timerObj.hours).slice(-pad.length)
      + ":" + String("00" + timerObj.minutes).slice(-pad.length)
      + ":" + String("00" + timerObj.seconds).slice(-pad.length);
    return timer;
  }

  componentDidMount() {
    this.countDownAuction();
    this.interval = setInterval(() => this.countDownAuction(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return this.state.timeleft;
  }
}

export default CountdownTimer;
