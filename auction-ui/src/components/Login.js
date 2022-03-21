/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React, { Component } from 'react';
import { SpinnerButton } from './Spinner.js';

import UserService from '../services/Users.js';
import { Link, Navigate } from 'react-router-dom';
import validator from 'validator';
import { SITE_LOGO, SITE_NAME } from '../services/Constants';
import Footer from './Footer';
import { toast } from 'react-toastify';


class Login extends Component {

  constructor(props) {
    super(props);

    this.users = new UserService();

    this.state = {
      user: {
        org: "org1",
      },
      isCreatingAccount: false,
      isLoading: false,
      isLoginSuccess: this.users.isUserLogin(),
      message: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    document.title = SITE_NAME + ": Sign In";
  }

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    let user = { ...this.state.user }
    user[name] = value;
    this.setState({ user });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ isLoading: true });
    let userData = Object.fromEntries(
      Object.keys(this.state.user)
        .map(k => [k, validator.escape(this.state.user[k])])
    );
    this.users.login(userData).then((response) => {
      if (response.message) {
        this.setState({
          message: response.message,
          isLoading: false,
        });
        toast.dismiss();
        toast.error(response.message);

      } else {
        this.setState({ isLoginSuccess: true, isLoading: false });
      }
    }).catch(err => {
      toast.dismiss();
      toast.error(err);
      this.setState({ isLoading: false });
    });
  }

  renderContent() {

    return (
      <div className="login-form vh-100 d-flex text-center">
        <form className="form-signin shadow" onSubmit={this.handleSubmit}>
          <div className="d-flex justify-content-center align-items-center">
            <img className="mb-4" src={SITE_LOGO} alt="{SITE_NAME}" width="" height="200" />
          </div>

          {this.state.message && <div className="alert alert-danger my-4" role="alert">{this.state.message}</div>}
          <input type="text" className="form-control" name="username" placeholder="Username" onChange={this.handleChange} required autoFocus />
          <input type="password" className="form-control mt-2" name="password" placeholder="Password" onChange={this.handleChange} required />
          <button className="btn btn-primary btn-block my-4" type="submit">Sign in
            {this.state.isLoading && <SpinnerButton />}
          </button>
          <Link to="/register-member">Create a New Account</Link>
          <Footer />
        </form>
      </div>
    );
  }

  render() {
    if (this.state.isLoginSuccess) {
      return <Navigate to="/" replace={true} />;
    }
    return this.renderContent();
  }
}

export default Login;
