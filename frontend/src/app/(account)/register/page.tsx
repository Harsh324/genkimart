"use client";

import HeaderOne from "@/components/header/HeaderOne";
import FooterOne from "@/components/footer/FooterOne";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
    const { user, register, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/profile");
        }
    }, [loading, user, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {               // safety
            router.replace("/profile");
            return;
        }
        await register({ email, username, password1, password2 });
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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
                                    <a className="current" href="/register">Register</a>
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

                                    <h3 className="title">Register Into Your Account</h3>

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
                                            <label htmlFor="username">Username*</label>
                                            <input
                                                type="text"
                                                id="username"
                                                required
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </div>

                                        <div className="input-wrapper">
                                            <label htmlFor="password1">Password*</label>
                                            <input
                                                type="password"
                                                id="password1"
                                                required
                                                value={password1}
                                                onChange={(e) => setPassword1(e.target.value)}
                                            />
                                        </div>

                                        <div className="input-wrapper">
                                            <label htmlFor="password2">Confirm Password*</label>
                                            <input
                                                type="password"
                                                id="password2"
                                                required
                                                value={password2}
                                                onChange={(e) => setPassword2(e.target.value)}
                                            />
                                        </div>

                                        <button className="rts-btn btn-primary" disabled={loading} type="submit">
                                            {loading ? "Please wait..." : "Register Account"}
                                        </button>

                                        <div className="another-way-to-registration">
                                            <div className="registradion-top-text">
                                                <span>Or Register With</span>
                                            </div>
                                            <div className="login-with-brand">
                                                <a href="#" className="single" aria-label="Register with Google">
                                                    <img src="/assets/images/form/google.svg" alt="login" />
                                                </a>
                                                <a href="#" className="single" aria-label="Register with Facebook">
                                                    <img src="/assets/images/form/facebook.svg" alt="login" />
                                                </a>
                                            </div>
                                            <p>
                                                Already Have Account? <a href="/login">Login</a>
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
