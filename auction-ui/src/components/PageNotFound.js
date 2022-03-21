import React, { Component } from 'react';


class PageNotFound extends Component {

    // constructor(props) {
    //     super(props);
    // }

    render() {
        return (
            <div className="vh-100 d-flex">
                <div className="jumbotron jumbotron-fluid bg-warning shadow-sm rounded w-50 my-auto mx-auto text-center">
                    <h1 className="display-4">404 Page not found!</h1>
                </div>
            </div>
        );
    }

}

export default PageNotFound;