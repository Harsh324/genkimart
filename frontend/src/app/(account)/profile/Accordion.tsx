'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateUser, changePassword } from '@/lib/authApi';
import { toast } from 'react-toastify';

const AccountTabs = () => {
  const { user, loading, logout, refetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'order' | 'address' | 'account'>('dashboard');

  // profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');

  // password form state
  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword1, setNewPassword1]       = useState('');
  const [newPassword2, setNewPassword2]       = useState('');

  const [savingProfile, setSavingProfile]     = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateUser({
        first_name: firstName || undefined,
        last_name : lastName  || undefined,
        username  : username  || undefined,
        // email     : email || undefined, // enable if you want users to change email
      });
      await refetchUser();
      toast.success('Profile updated');
    } catch (err: any) {
      const msg = err?.response?.data || 'Failed to update profile';
      toast.error(typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPassword(true);
      await changePassword({
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      });
      setOldPassword('');
      setNewPassword1('');
      setNewPassword2('');
      toast.success('Password changed');
    } catch (err: any) {
      const msg = err?.response?.data || 'Failed to change password';
      toast.error(typeof msg === 'string' ? msg : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // minimal guard
  if (!loading && !user) {
    return (
      <div className="account-tab-area-start rts-section-gap">
        <div className="container-2">
          <div className="row">
            <div className="col-lg-12">
              <p>You need to be logged in to view your profile. <a href="/login">Login</a></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-tab-area-start rts-section-gap">
      <div className="container-2">
        <div className="row">
          <div className="col-lg-3">
            <div className="nav accout-dashborard-nav flex-column nav-pills me-3" role="tablist">
              <button
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="fa-regular fa-chart-line"></i> Profile
              </button>
              <button
                className={`nav-link ${activeTab === 'order' ? 'active' : ''}`}
                onClick={() => setActiveTab('order')}
              >
                <i className="fa-regular fa-bag-shopping"></i> Your Orders
              </button>
              <button
                className={`nav-link ${activeTab === 'address' ? 'active' : ''}`}
                onClick={() => setActiveTab('address')}
              >
                <i className="fa-regular fa-location-dot"></i> My Address
              </button>
              <button
                className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <i className="fa-regular fa-user"></i> Account Details
              </button>
              <button className="nav-link" onClick={logout}>
                <i className="fa-light fa-right-from-bracket"></i> Log Out
              </button>
            </div>
          </div>

          <div className="col-lg-9 pl--50 pl_md--10 pl_sm--10 pt_md--30 pt_sm--30">
            <div className="tab-content">

              {activeTab === 'dashboard' && (
                <div className="dashboard-account-area">
                  <h2 className="title">
                    Hello {user?.username || user?.first_name || user?.email}!{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Log Out.</a>
                  </h2>
                  <p className="disc">
                    From your account dashboard you can view your recent orders,
                    manage your shipping and billing addresses, and edit your password and account details.
                  </p>
                </div>
              )}

              {activeTab === 'order' && (
                <div className="order-table-account">
                  <div className="h2 title">Your Orders</div>
                  {/* TODO: Replace with orders fetched from your Orders API */}
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>#1357</td>
                          <td>—</td>
                          <td>—</td>
                          <td>—</td>
                          <td><a href="#" className="btn-small d-block">View</a></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="shipping-address-billing-address-account">
                  {/* TODO: Hook to Address API; keeping your sample layout */}
                  <div className="half">
                    <h2 className="title">Billing Address</h2>
                    <p className="address">—</p>
                    <a href="#">Edit</a>
                  </div>
                  <div className="half">
                    <h2 className="title">Shipping Address</h2>
                    <p className="address">—</p>
                    <a href="#">Edit</a>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <>
                  {/* Profile */}
                  <form className="account-details-area" onSubmit={onSaveProfile}>
                    <h2 className="title">Account Details</h2>
                    <div className="input-half-area">
                      <div className="single-input">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="single-input">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />

                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                    />

                    <button className="rts-btn btn-primary" disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save Change'}
                    </button>
                  </form>

                  {/* Change Password */}
                  <form className="account-details-area mt--30" onSubmit={onChangePassword}>
                    <h2 className="title">Change Password</h2>
                    <input
                      type="password"
                      placeholder="Current Password *"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password *"
                      value={newPassword1}
                      onChange={(e) => setNewPassword1(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm Password *"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      required
                    />
                    <button className="rts-btn btn-primary" disabled={savingPassword}>
                      {savingPassword ? 'Saving…' : 'Update Password'}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTabs;
