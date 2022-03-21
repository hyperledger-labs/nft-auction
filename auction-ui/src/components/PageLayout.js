import React, { Component } from 'react';
import UserService from '../services/Users';
import Spinner from './Spinner.js';

import Navbar from './Navbar.js';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';


class PageLayout extends Component {

    constructor(props) {
        super(props);
        this.users = new UserService();
        this.state = {
            isLoading: true,
            user: this.users.currentUser(),
            newSocket: false,
        };
    }

    componentDidMount() {
        this.setState({ isLoading: false });
    }

    componentWillUnmount() {
        //Empty on purpose
    }

    render() {
        if (this.state.isLoading) {
            return <Spinner />;
        }

        return (
            <div>
                <Navbar />
                <main role="main">
                    <div className="py-1 bg-light">
                        <Outlet/>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }
}
export default PageLayout;
