/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import $ from 'jquery';

import Spinner from './components/Spinner.js';

import UserService from './services/Users.js';
import UtilsService from './services/Utils.js';
import { Outlet } from 'react-router-dom';
import { SITE_NAME } from './services/Constants.js';
import { ToastContainer } from 'react-toastify';

class App extends Component {

  constructor(props) {
    super(props);
    this.users = new UserService();
    this.utils = new UtilsService();
    this.state = {
      isLoading: true,
      user: this.users.currentUser(),
    };
    document.title = SITE_NAME;
  }

  componentDidMount() {
    this.setState({ isLoading: false });
    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  componentWillUnmount() {
    //Empty on purpose
  }

  render() {
    let { isLoading } = this.state;
    if (isLoading) {
      return <Spinner />;
    }

    return (
      <div>
        <Outlet />
        <ToastContainer
          containerId="tostErrors"
          draggable={false} 
          position="top-right" 
          autoClose={false} 
          hideProgressBar={true} 
        />
      </div>

    );
  }

}

export default App;
