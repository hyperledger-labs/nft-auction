/**
 * Copyright IT People Corporation. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contributors: Mohan Venkataraman, Dilip Manjunatha, Aashish Shrestha, Sahinul Haque
 */

import React from "react";
import {
    Routes,
    Route,
    NavLink,
    useLocation,
    Navigate
} from "react-router-dom";

import Login from "./components/Login";
import PageNotFound from "./components/PageNotFound";
import CreateAccount from "./components/CreateAccount";
import App from "./App";
import ManageAuctions from "./components/ManageAuctions";
import ArtworkGrid from "./components/ArtworkGrid";
import Dashboard from "./components/Dashboard";
import UserService from './services/Users.js';
import PageLayout from "./components/PageLayout";


export default function RouteConfig() {
    return (
        <Routes>
            <Route path="/" element={<App />} >
                <Route index element={<Dashboard />} />
                <Route element={<PageLayout />}>
                    <Route path="manageAuctions" element={<RequireAuth><ManageAuctions /></RequireAuth>} />
                    <Route path="manageArtWork" element={<RequireAuth><ArtworkGrid /></RequireAuth>} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register-member" element={<CreateAccount />} />
                <Route path="/signout" element={<SignOut />} />
                <Route path="/*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
}

function RequireAuth({ children }) {
    let auth = new UserService();
    let location = useLocation();

    if (!auth.isUserLogin()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

function SignOut() {
    localStorage.clear();
    return <Navigate to="/login" replace={true} />;
}
