'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { useAuth } from "@/components/auth/AuthProvider";

const MobileMenu = () => {
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const [openThirdLevelKey, setOpenThirdLevelKey] = useState<string | null>(null);

    const toggleMenu = (index: number) => {
        setOpenMenuIndex(prev => (prev === index ? null : index));
    };

    const toggleThirdMenu = (key: string) => {
        setOpenThirdLevelKey(prev => (prev === key ? null : key));
    };

    const { user, logout } = useAuth();

    return (
        <nav className="nav-main mainmenu-nav mt--30">
            <ul className="mainmenu metismenu" id="mobile-menu-active">
                {user ? (
                    <>
                        <li><Link className="main" href="/profile">Account</Link></li>
                        <li><button onClick={logout} className="main" style={{ background: "none", border: "none" }}>Logout</button></li>
                    </>
                ) : (
                    <>
                        <li><Link className="main" href="/login">Login</Link></li>
                        <li><Link className="main" href="/register">Register</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default MobileMenu;
