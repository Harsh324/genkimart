"use client"
import React, { useState, useEffect, useRef } from 'react';
import HeaderNav from './HeaderNav';
import CategoryMenu from './CategoryMenu';
import Cart from './Cart';
import WishList from './WishList';
import Sidebar from './Sidebar';
import BackToTop from "@/components/common/BackToTop";
import { useCompare } from '@/components/header/CompareContext';
import { useRouter } from 'next/navigation';

function HeaderOne() {
    const { compareItems } = useCompare();

    // Countdown setup
    useEffect(() => {
        const countDownElements = document.querySelectorAll<HTMLElement>('.countDown');
        const endDates: Date[] = [];

        countDownElements.forEach((el) => {
            const match = el.innerText.match(/([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4}) ([0-9]{2}):([0-9]{2}):([0-9]{2})/);
            if (!match) return;

            const end = new Date(+match[3], +match[1] - 1, +match[2], +match[4], +match[5], +match[6]);
            if (end > new Date()) {
                endDates.push(end);
                const next = calcTime(end.getTime() - new Date().getTime());
                el.innerHTML = renderDisplay(next);
            } else {
                el.innerHTML = `<p class="end">Sorry, your session has expired.</p>`;
            }
        });

        const interval = setInterval(() => {
            countDownElements.forEach((el, i) => {
                const end = endDates[i];
                if (!end) return;
                const now = new Date();
                const diff = end.getTime() - now.getTime();

                if (diff <= 0) {
                    el.innerHTML = `<p class="end">Sorry, your session has expired.</p>`;
                } else {
                    const next = calcTime(diff);
                    el.innerHTML = renderDisplay(next);
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const calcTime = (milliseconds: number) => {
        const secondsTotal = Math.floor(milliseconds / 1000);
        const days = Math.floor(secondsTotal / 86400);
        const hours = Math.floor((secondsTotal % 86400) / 3600);
        const minutes = Math.floor((secondsTotal % 3600) / 60);
        const seconds = secondsTotal % 60;
        return [days, hours, minutes, seconds].map((v) => v.toString().padStart(2, '0'));
    };

    const renderDisplay = (timeArr: string[]) => {
        return timeArr
            .map((item) => `<div class='container'><div class='a'><div>${item}</div></div></div>`)
            .join('');
    };

    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const allSuggestions = [
        "Profitable business makes your profit Best Solution",
        "Details Profitable business makes your profit",
        "One Profitable business makes your profit",
        "Me Profitable business makes your profit",
        "Details business makes your profit",
        "Firebase business makes your profit",
        "Netlyfy business makes your profit",
        "Profitable business makes your profit",
        "Valuable business makes your profit",
        "System business makes your profit",
        "Profitables business makes your profit",
        "Content business makes your profit",
        "Dalivaring business makes your profit",
        "Staning business makes your profit",
        "Best business makes your profit",
        "cooler business makes your profit",
        "Best-one Profitable business makes your profit",
        "Super Fresh Meat",
        "Original Fresh frut",
        "Organic Fresh frut",
        "Lite Fresh frut"
    ];

    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            const filtered = allSuggestions.filter(item =>
                item.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 5));
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchTerm]);

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        setShowSuggestions(false);
        router.push(`/shop?search=${encodeURIComponent(suggestion)}`);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowSuggestions(false);
        } else {
            router.push('/shop');
        }
    };

    return (
        <>
            <div className="rts-header-one-area-one">
                {/* top bar */}
                <div className="header-top-area">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="bwtween-area-header-top">
                                    <div className="discount-area">
                                        <p className="disc">
                                            FREE delivery &amp; 40% Discount for next 3 orders! Place your 1st order in.
                                        </p>
                                        <div className="countdown">
                                            <div className="countDown">10/05/2025 10:20:00</div>
                                        </div>
                                    </div>
                                    <div className="contact-number-area">
                                        <p>Need help? Call Us: <a href="tel:+4733378901">+258 3268 21485</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* mid bar */}
                <div className="header-mid-one-wrapper">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="header-mid-wrapper-between">
                                    <div className="nav-sm-left">
                                        <ul className="nav-h_top">
                                            <li><a href="/about">About Us</a></li>
                                            <li><a href="/account">My Account</a></li>
                                            <li><a href="/wishlist">Wishlist</a></li>
                                        </ul>
                                        <p className="para">We deliver to your everyday from 7:00 to 22:00</p>
                                    </div>
                                    <div className="nav-sm-left">
                                        <ul className="nav-h_top language">
                                            <li className="category-hover-header language-hover">
                                                <a href="#">English</a>
                                                <ul className="category-sub-menu">
                                                    <li><a href="#"><span>Italian</span></a></li>
                                                    <li><a href="#"><span>Russian</span></a></li>
                                                    <li><a href="#"><span>Chinian</span></a></li>
                                                </ul>
                                            </li>
                                            <li className="category-hover-header language-hover">
                                                <a href="#">USD</a>
                                                <ul className="category-sub-menu">
                                                    <li><a href="#"><span>Rubol</span></a></li>
                                                    <li><a href="#"><span>Rupi</span></a></li>
                                                    <li><a href="#"><span>Euro</span></a></li>
                                                </ul>
                                            </li>
                                            <li><a href="/trackorder">Track Order</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* logo + search */}
                <div className="search-header-area-main">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="logo-search-category-wrapper">
                                    <a href="/" className="logo-area">
                                        <img src="/assets/images/logo/logo-01.svg" alt="logo-main" className="logo" />
                                    </a>
                                    <div className="category-search-wrapper">
                                        <div className="category-btn category-hover-header">
                                            <img className="parent" src="/assets/images/icons/bar-1.svg" alt="icons" />
                                            <span>Categories</span>
                                            <CategoryMenu />
                                        </div>
                                        <form onSubmit={handleSubmit} className="search-header" autoComplete="off">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                placeholder="Search for products, categories or brands"
                                                required
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                                            />
                                            <button type="submit" className="rts-btn btn-primary radious-sm with-icon">
                                                <div className="btn-text">Search</div>
                                                <div className="arrow-icon">
                                                    <i className="fa-light fa-magnifying-glass" />
                                                </div>
                                            </button>

                                            {/* Autocomplete dropdown */}
                                            {showSuggestions && suggestions.length > 0 && (
                                                <ul className="autocomplete-suggestions" style={{
                                                    position: 'absolute',
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #ccc',
                                                    marginTop: '4px',
                                                    width: '100%',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    zIndex: 1000,
                                                    listStyleType: 'none',
                                                    padding: 0,
                                                    borderRadius: '4px',
                                                }}>
                                                    {suggestions.map((suggestion, index) => (
                                                        <li
                                                            key={index}
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                            }}
                                                            onMouseDown={(e) => e.preventDefault()} // prevent input blur
                                                        >
                                                            {suggestion}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </form>
                                    </div>
                                    <div className="actions-area">
                                        <div className="search-btn" id="searchs">
                                            <svg width={17} height={16} viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="..." fill="#1F1F25" />
                                            </svg>
                                        </div>
                                        <div className="menu-btn" id="menu-btn">
                                            <svg width={20} height={16} viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect y={14} width={20} height={2} fill="#1F1F25" />
                                                <rect y={7} width={20} height={2} fill="#1F1F25" />
                                                <rect width={20} height={2} fill="#1F1F25" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="accont-wishlist-cart-area-header">
                                        <a href="/account" className="btn-border-only account">
                                            <i className="fa-light fa-user" />
                                            <span>Account</span>
                                        </a>
                                        <a href="/shop-compare" className="btn-border-only account compare-number">
                                            <i className="fa-regular fa-code-compare" />
                                            <span className="number">{compareItems.length}</span>
                                        </a>
                                        <WishList />
                                        <Cart />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* main nav */}
                <HeaderNav />
            </div>
            <Sidebar />
            <BackToTop />
        </>
    );
}

export default HeaderOne;
