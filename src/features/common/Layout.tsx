import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#E8EDF2]">
            {/* Sidebar for mobile (overlay) */}
            <div
                className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="w-64 bg-teal-50 border-r border-teal-100 flex-shrink-0">
                    <Sidebar />
                </div>
                {/* Background overlay */}
                <div
                    className="flex-1"
                    onClick={() => setSidebarOpen(false)}
                />
            </div>

            {/* Sidebar for desktop */}
            <div className="hidden lg:flex w-64 bg-teal-50 border-r border-teal-100 flex-shrink-0">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-1 sm:py-2 flex">
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 rounded bg-gray-100 align-middle hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 h-fit self-center"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    {/* Header Content */}
                    <div className="flex-1 ml-4">
                        <Header />
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
