import React from 'react';
import { Outlet } from 'react-router-dom';
// import Header from './Header';
// import Footer from './Footer';
import Sidebar from './Sidebar';
// import '../styles/main.css';
// Import your main CSS file

const Layout = () => {
    return (

        <div className="flex h-screen bg-gray-50">
            {/* <Header /> */}
            <div className="main-container">
                <Sidebar />
                <main className="content">
                    <Outlet />
                </main>
            </div>
            {/* <Footer /> */}
        </div>
    );
}
export default Layout;