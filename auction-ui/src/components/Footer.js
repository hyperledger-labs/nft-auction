import React, { Component } from 'react';


class Footer extends Component {

    // constructor(props) {
    //     super(props);
    // }

    render() {
        return (
            <div className="d-flex my-1 justify-content-center">
                <span>&copy; {new Date().getFullYear()} Powered by <a href="https://chainyard.com/" target="_blank" rel="noopener noreferrer">Chainyard</a></span>
            </div>
        );
    }

}

export default Footer;