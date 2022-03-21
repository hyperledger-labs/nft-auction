import React, { Component } from 'react';
import { Navigate } from 'react-router';
import UserService from '../services/Users.js';


class Dashboard extends Component {

    constructor(props) {
        super(props);
        this.users = new UserService();
    }

    render() {
        return (
            this.users.isUserLogin() ? 
            this.users.userType==="AH" ? <Navigate to="/manageAuctions" replace={true} /> : <Navigate to="/manageArtWork" replace={true} />
                : <Navigate to="/login" replace={true} />
        );
    }

}

export default Dashboard;