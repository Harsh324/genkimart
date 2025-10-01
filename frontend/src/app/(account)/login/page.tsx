"use client";

import HeaderOne from "@/components/header/HeaderOne";
import FooterOne from "@/components/footer/FooterOne";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, login, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const sp = useSearchParams();

    const getRedirectPath = () => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("postLoginRedirect");
            if (stored) {
                localStorage.removeItem("postLoginRedirect");
                return stored;
            }
        }
        return sp.get("next") || "/profile";
    };

    useEffect(() => {
        if (!loading && user) {
            router.replace(getRedirectPath());
        }
    }, [loading, user, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {               // <-- extra safety
            router.replace(getRedirectPath());
            return;
        }
        await login({ email, password });
        router.replace(getRedirectPath());
    };

    return (
        <div className="demo-one">
            <HeaderOne />

            <>
                <div className="rts-navigation-area-breadcrumb bg_light-1">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="navigator-breadcrumb-wrapper">
                                    <a href="/">Home</a>
                                    <i className="fa-regular fa-chevron-right" />
                                    <a className="current" href="/login">
                                        Log In
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-seperator bg_light-1">
                    <div className="container">
                        <hr className="section-seperator" />
                    </div>
                </div>

                {/* rts register area start */}
                <div className="rts-register-area rts-section-gap bg_light-1">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="registration-wrapper-1">
                                    <div className="logo-area mb--0">
                                        <img className="mb--10" src="/assets/images/logo/fav.png" alt="logo" />
                                    </div>
                                    <h3 className="title">Login Into Your Account</h3>

                                    <form onSubmit={onSubmit} className="registration-form" autoComplete="on">
                                        <div className="input-wrapper">
                                            <label htmlFor="email">Email*</label>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>

                                        <div className="input-wrapper">
                                            <label htmlFor="password">Password*</label>
                                            <input
                                                type="password"
                                                id="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>

                                        <button className="rts-btn btn-primary" disabled={loading} type="submit">
                                            {loading ? "Please wait..." : "Login Account"}
                                        </button>

                                        <div className="another-way-to-registration">
                                            {/* <div className="registradion-top-text">
                                                <span>Or Register With</span>
                                            </div>
                                            <div className="login-with-brand">
                                                <a href="#" className="single" aria-label="Login with Google">
                                                    <img src="/assets/images/form/google.svg" alt="login" />
                                                </a>
                                                <a href="#" className="single" aria-label="Login with Facebook">
                                                    <img src="/assets/images/form/facebook.svg" alt="login" />
                                                </a>
                                            </div> */}
                                            <p>
                                                Don&apos;t have an account? <a href="/register">Registration</a>
                                            </p>
                                        </div>
                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* rts register area end */}
            </>

            <FooterOne />
        </div>
    );
}
