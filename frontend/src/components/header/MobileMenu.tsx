'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const MobileMenu = () => {
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const [openThirdLevelKey, setOpenThirdLevelKey] = useState<string | null>(null);

    const toggleMenu = (index: number) => {
        setOpenMenuIndex(prev => (prev === index ? null : index));
    };

    const toggleThirdMenu = (key: string) => {
        setOpenThirdLevelKey(prev => (prev === key ? null : key));
    };

    return (
        <nav className="nav-main mainmenu-nav mt--30">
            <ul className="mainmenu metismenu" id="mobile-menu-active">

                {/* Home */}
                {/* <li className={`has-droupdown ${openMenuIndex === 0 ? 'mm-active' : ''}`}>
                    <a href="#" className="main" onClick={() => toggleMenu(0)}>Home</a>
                    <ul className={`submenu mm-collapse ${openMenuIndex === 0 ? 'mm-show' : ''}`}>
                        <li><Link className="mobile-menu-link" href="/profile">Home One</Link></li>
                        <li><Link className="mobile-menu-link" href="/index-two">Home Two</Link></li>
                        <li><Link className="mobile-menu-link" href="/index-three">Home Three</Link></li>
                        <li><Link className="mobile-menu-link" href="/index-four">Home Four</Link></li>
                        <li><Link className="mobile-menu-link" href="/index-five">Home Five</Link></li>
                    </ul>
                </li> */}

                {/* Account */}
                <li><Link className="main" href="/profile">Account</Link></li>
            </ul>
        </nav>
    );
};

export default MobileMenu;
