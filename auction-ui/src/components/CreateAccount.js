/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */


import React, { Component } from 'react';
import { SpinnerButton } from './Spinner.js';
import UsersService from '../services/Users.js';
import { Link, Navigate } from 'react-router-dom';
import validator from 'validator';
import { SITE_LOGO, SITE_NAME } from '../services/Constants';
import Footer from './Footer.js';
import { toast } from 'react-toastify';


class CreateAccount extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      user: {},
      formErrors: {},
      formTouched: false,
      fieldsTouched: [],
      isValidForm: false,
      confirmPassword: null,
      isSuccessResponse: false,
      errorResponse: ""
    };

    this.users = new UsersService();

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    document.title = SITE_NAME + ": Member registration";
  }

  handleChange(event) {
    const value = event.target.value;
    const name = event.target.name;

    let input_states = { ...this.state };
    if (!input_states.fieldsTouched.includes(name)) {
      input_states.fieldsTouched.push(name);
    }
    input_states.formTouched = false;

    if (name === "confirm_password") {
      input_states.confirmPassword = value;
    } else {
      input_states.user[name] = value;
    }
    this.setState(input_states);

    this.formValidate(name, value);
  }

  //Validation
  formValidate(fieldName, value) {

    let { formErrors, isValidForm, formTouched, fieldsTouched } = this.state;
    value = value + '';
    switch (fieldName) {
      case "userID":
        if (validator.isEmpty(value)) {
          formErrors["userID"] = "Username is required.";
        } else {
          formErrors["userID"] = null;
        }
        break;
      case "password":
        if (!validator.isStrongPassword(value, { minLength: 5, minUppercase: 1, minNumbers: 1, minLowercase: 0, minSymbols: 0 })) {
          formErrors["password"] = "Password must contains min 5 chars and one uppercase and one number. ex- sD2ww";
        } else {
          formErrors["password"] = null;
        }
        break;
      case "confirm_password":
        if (validator.isEmpty(value)) {
          formErrors["confirm_password"] = "Confirm Password is required.";
        }
        else if (!validator.equals(value, String(this.state.user.password))) {
          formErrors["confirm_password"] = "Password and Confirm Password didn't matched.";
        } else {
          formErrors["confirm_password"] = null;
        }
        break;
      case "name":
        if (validator.isEmpty(value)) {
          formErrors["name"] = "Name is required.";
        } else {
          formErrors["name"] = null;
        }
        break;
      case "email":
        if (validator.isEmpty(value)) {
          formErrors["email"] = "Email is required.";
        } else if (!validator.isEmail(value)) {
          formErrors["email"] = "Email is not valid.";
        } else {
          formErrors["email"] = null;
        }
        break;
      case "phone":
        if (validator.isEmpty(value)) {
          formErrors["phone"] = "Phone is required.";
        } else if (!validator.isMobilePhone(value)) {
          formErrors["phone"] = "Phone is not valid.";
        } else {
          formErrors["phone"] = null;
        }
        break;
      case "address":
        if (validator.isEmpty(value)) {
          formErrors["address"] = "Address is required.";
        } else {
          formErrors["address"] = null;
        }
        break;
      case "paymentID":
        if (validator.isEmpty(value)) {
          formErrors["paymentID"] = "Payment ID is required.";
        } else {
          formErrors["paymentID"] = null;
        }
        break;
      default:
        break;
    }

    //removing valid fields from errors
    let formErrorsFiltered = Object.fromEntries(
      Object.keys(formErrors).filter(f => formErrors[f])
        .map(k => [k, formErrors[k]])
    );
    isValidForm = !Object.keys(formErrorsFiltered).length;
    formTouched = fieldsTouched.length === 8; //there are 10 required fields
    this.setState({ formErrors: formErrorsFiltered, isValidForm, formTouched });
  }

  handleSubmit(event) {

    let userData = Object.fromEntries(
      Object.keys(this.state.user)
        .map(k => [k, validator.escape(this.state.user[k])])
    );
    this.setState({
      user: {
        ...userData,
        userType: this.props["userType"] || "TRD",//AH-auction house, TRD- trader
      },
      isLoading: true,
    }, () => {
      let user = this.state.user;
      this.users.createNewUser(user).then((res) => {
        if (res.success) {
          this.setState({
            isLoading: false,
            formErrors: {},
            formTouched: false,
            fieldsTouched: [],
            isValidForm: false,
            confirmPassword: null,
            isSuccessResponse: false,
            errorResponse: "",
            user: {}
          });

          toast.dismiss();
          toast.success("User account created successfully. Redirecting to sign in page.", {
            autoClose: 5000,
            hideProgressBar: false,
            pauseOnHover: false,
            pauseOnFocusLoss: false,
            onClose: () => {
              this.setState({ isSuccessResponse: true });
            }
          });

        } else {
          this.setState({
            isLoading: false,
            isSuccessResponse: false,
            errorResponse: res.message,
            formTouched: false,
            isValidForm: false,
            confirmPassword: null,
            // formErrors: {},
            // fieldsTouched: [],
            // confirmPassword: null,
            // user: {}
          });
          document.getElementById("password").click();
          document.getElementById("confirm_password").click();

          toast.dismiss();
          toast.error("Failed to submit. Please try again.");
        }
      })
        .catch(err => {
          toast.dismiss();
          toast.error(err);

          this.setState({
            isLoading: false,
            isSuccessResponse: false,
            errorResponse: err,
            formTouched: false,
            isValidForm: false,
            confirmPassword: null,
            // formErrors: {},
            // fieldsTouched: [],
            // confirmPassword: null,
            // user: {}
          });
          document.getElementById("password").click();
          document.getElementById("confirm_password").click();
        })
        ;
    });
    event.preventDefault();
  }

  componentWillUnmount() {
  }

  renderContent() {
    return (
      <div className="register-form vh-100 d-flex text-center">
        <form className="form-create-account shadow" id="formAccount" onSubmit={this.handleSubmit} noValidate>
          <div className="d-flex justify-content-center align-items-center">
            <img className="mb-4" src={SITE_LOGO} alt="{SITE_NAME}" width="" height="75" />
          </div>
          <div className="row">
            <div className="col-md-12 mb-1">
              <label htmlFor="username">Username</label>
              <input type="text" className="form-control" id="username" name="userID" value={this.state.user.userID || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.userID}</div>
            </div>
            <div className="col-md-12 mb-1">
              <label htmlFor="password">Password</label>
              <input type="password" className="form-control" id="password" name="password" onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.password}</div>
            </div>
            <div className="col-md-12 mb-1">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input type="password" className="form-control" id="confirm_password" name="confirm_password" onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.confirm_password}</div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-1">
              <label htmlFor="name">Name</label>
              <input type="text" className="form-control" id="name" name="name" value={this.state.user.name || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.name}</div>
            </div>
            <div className="col-md-6 mb-1">
              <label htmlFor="email">Email Address</label>
              <input type="email" className="form-control" id="email" name="email" value={this.state.user.email || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.email}</div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-1">
              <label htmlFor="phone">Phone</label>
              <input type="tel" className="form-control" id="phone" name="phone" value={this.state.user.phone || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.phone}</div>
            </div>
            <div className="col-md-6 mb-1">
              <label htmlFor="address">Address</label>
              <input type="text" className="form-control" id="address" name="address" value={this.state.user.address || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.address}</div>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-12 mb-1">
              <label htmlFor="paymentID">Payment ID</label>
              <input type="text" className="form-control" id="paymentID" name="paymentID" value={this.state.user.paymentID || ''} onChange={this.handleChange} onClick={this.handleChange} required />
              <div className="text-danger">{this.state.formErrors.paymentID}</div>
            </div>
          </div>
          <button className="btn btn-primary btn-block my-1" type="submit" disabled={this.state.isValidForm && this.state.formTouched ? false : true}>
            Sign Up
            {this.state.isLoading && <SpinnerButton />}
          </button>
          <Link to="/login">Back to Sign In</Link>
          <Footer />
        </form>
      </div>
    )
  }

  render() {
    if (this.users.isUserLogin()) {
      return <Navigate to="/" replace={true} />;
    }
    if (this.state.isSuccessResponse) {
      return <Navigate to="/login" replace={true} />;
    }

    return this.renderContent();
  }
}
export default CreateAccount;

