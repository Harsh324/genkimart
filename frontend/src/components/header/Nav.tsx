"use client"
import React from 'react';
function NavItem() {
    return (
        <div>
            <nav>
                <ul className="parent-nav">
                    <li className="parent has-dropdown">
                        <a className="nav-link" href="#">
                            Home
                        </a>
                        <ul className="submenu">
                            <li>
                                <a className="sub-b" href="/">
                                    Home One
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/index-two">
                                    Home Two
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/index-three">
                                    Home Three
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/index-four">
                                    Home Four
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/index-five">
                                    Home Five
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li className="parent">
                        <a href="/about">About</a>
                    </li>
                    <li className="parent with-megamenu">
                        <a href="#">Shop</a>
                        <div className="rts-megamenu">
                            <div className="wrapper">
                                <div className="row align-items-center">
                                    <div className="col-lg-8">
                                        <div className="megamenu-item-wrapper">
                                            {/* single item areas start */}
                                            <div className="single-megamenu-wrapper">
                                                <p className="title">Shop Layout</p>
                                                <ul>
                                                    <li>
                                                        <a href="/shop">
                                                            Shop Grid Sidebar
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a href="/shop-list-sidebar">
                                                            Shop list Sidebar
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a href="/shop-grid-top-filter">
                                                            Shop Top Filter Grid
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a href="/shop-list-top-filter">
                                                            Shop Top Filter List
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                            {/* single item areas end */}
                                            {/* single item areas start */}
                                            <div className="single-megamenu-wrapper">
                                                <p className="title">Shop Details</p>
                                                <ul>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop/firebase-business-makes-your-profit"
                                                        >
                                                            Shop Details
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-details-2"
                                                        >
                                                            Shop Details V2
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-details-right-sidebar"
                                                        >
                                                            Shop Details V3
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-details-4"
                                                        >
                                                            Shop Details V4
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                            {/* single item areas end */}
                                            {/* single item areas start */}
                                            <div className="single-megamenu-wrapper">
                                                <p className="title">Product Feature</p>
                                                <ul>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-details-variable"
                                                        >
                                                            Variable product
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-details-affiliats"
                                                        >
                                                            Affiliate product
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/shop-compare"
                                                        >
                                                            Shop Compare
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                            {/* single item areas end */}
                                            {/* single item areas start */}
                                            <div className="single-megamenu-wrapper">
                                                <p className="title">Shop Others</p>
                                                <ul>
                                                    <li>
                                                        <a className="sub-b" href="/cart">
                                                            Cart
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a className="sub-b" href="/checkout">
                                                            Checkout
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="sub-b"
                                                            href="/trackorder"
                                                        >
                                                            Track Order
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                            {/* single item areas end */}
                                        </div>
                                    </div>
                                    <div className="col-lg-4">
                                        <a
                                            href="/shop"
                                            className="feature-add-megamenu-area"
                                        >
                                            <img
                                                src="assets/images/feature/05.jpg"
                                                alt="feature_product"
                                            />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="parent has-dropdown">
                        <a className="nav-link" href="#">
                            Vendors
                        </a>
                        <ul className="submenu">
                            <li>
                                <a className="sub-b" href="/vendor-list">
                                    Vendor List
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/vendor-grid">
                                    Vendor Grid
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/vendor-details">
                                    Vendor Details
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li className="parent has-dropdown">
                        <a className="nav-link" href="#">
                            Pages
                        </a>
                        <ul className="submenu">
                            <li>
                                <a className="sub-b" href="/dashboard">
                                    Dashboard
                                    <span className="badge">( New )</span>
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/about">
                                    About
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/store">
                                    Store
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/faq">
                                    Faq's
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/invoice">
                                    Invoice
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/contact">
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/register">
                                    Register
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/login">
                                    Login
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/privacy-policy">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/cookies-policy">
                                    Cookies Policy
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/terms-condition">
                                    Terms &amp; Condition
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/404">
                                    Error
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li className="parent has-dropdown">
                        <a className="nav-link" href="#">
                            Blog
                        </a>
                        <ul className="submenu">
                            <li>
                                <a className="sub-b" href="/blog">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a
                                    className="sub-b"
                                    href="/blog-list-left-sidebar"
                                >
                                    Blog List Left Sidebar
                                </a>
                            </li>
                            <li>
                                <a
                                    className="sub-b"
                                    href="/blog-list-right-sidebar"
                                >

                                    Blog List Right Sidebar
                                </a>
                            </li>
                            <li>
                                <a className="sub-b" href="/blog/details-profitable-business-makes-your-profit">
                                    Blog Details
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li className="parents">
                        <a target='_blank' href="/dashboard">
                            Dashboard
                            <span className="badge">New</span>
                        </a>
                    </li>
                    <li className="parent">
                        <a href="/contact">Contact</a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default NavItem;