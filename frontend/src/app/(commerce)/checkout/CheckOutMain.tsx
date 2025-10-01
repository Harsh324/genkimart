// // src/components/service/CheckOutMain.tsx
// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import { useAuth } from '@/components/auth/AuthProvider'; // same pattern as your Accordion/profile
// import { useCart } from '@/components/header/CartContext';

// const DEFAULT_SHIPPING_COST = 800;      // ¥800 (adjust if needed)
// const FREE_SHIPPING_THRESHOLD = 59.69;  // as requested

// const currency = new Intl.NumberFormat('ja-JP', {
//   style: 'currency',
//   currency: 'JPY',
// });

// function coerceNumberPrice(value: unknown): number {
//   if (typeof value === 'number') return value;
//   if (typeof value === 'string') {
//     const n = Number(value.replace(/[^\d.-]/g, ''));
//     return Number.isFinite(n) ? n : 0;
//   }
//   return 0;
// }

// export default function CheckOutMain() {
//   // ---- Auth (JWT) ----
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   // Protect page: redirect unauthenticated users to login (with return URL)
//   useEffect(() => {
//     if (!loading && !user) {
//       const callbackUrl = encodeURIComponent(pathname || '/');
//       router.push(`/login?callbackUrl=${callbackUrl}`);
//     }
//   }, [loading, user, router, pathname]);

//   // ---- Cart (new context) ----
//   const { items, isLoaded } = useCart(); // items: { product: ProductItem, quantity: number }

//   const subtotal = useMemo(() => {
//     return (items || []).reduce((sum, entry) => {
//       const price = coerceNumberPrice(entry.product?.price);
//       const qty = Number(entry.quantity || 0);
//       return sum + price * qty;
//     }, 0);
//   }, [items]);

//   const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
//   const total = subtotal + shippingCost;

//   // ---- Billing Prefill (Japan) ----
//   const [billingInfo, setBillingInfo] = useState({
//     email: '',
//     firstName: '',
//     lastName: '',
//     country: 'Japan',
//     line1: '',
//     line2:'',
//     city: '',
//     state: '', // prefecture
//     zip: '',
//     phone: '',
//     orderNotes: '',
//   });

//   useEffect(() => {
//     if (user) {
//       setBillingInfo((prev) => ({
//         ...prev,
//         email: user.email || prev.email,
//         firstName: (user as any).first_name || prev.firstName,
//         lastName: (user as any).last_name || prev.lastName,
//         country: prev.country || 'Japan',
//       }));
//     }
//   }, [user]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { id, value } = e.target;
//     setBillingInfo((prev) => ({ ...prev, [id]: value }));
//   };

//   // ---- Loading states (auth/cart) ----
//   if (loading || !isLoaded) {
//     return (
//       <div className="checkout-area rts-section-gap">
//         <div className="container"><p>Loading…</p></div>
//       </div>
//     );
//   }
//   if (!user) return null; // redirecting via effect above; avoid flicker

//   // ---- UI (kept your classes/styling) ----
//   return (
//     <div className="checkout-area rts-section-gap">
//       <div className="container">
//         <div className="row">
//           {/* Left: Billing Details */}
//           <div className="col-lg-8 pr--40 order-2 order-xl-1">
//             {/* Coupon UI removed */}

//             <div className="rts-billing-details-area">
//               <h3 className="title">Billing Details</h3>
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   // TODO: Persist billing info or proceed to payment
//                 }}
//               >
//                 {[
//                   { id: 'email',     label: 'Email Address*', type: 'email', autoComplete: 'email' },
//                   { id: 'firstName', label: 'First Name*',    autoComplete: 'given-name' },
//                   { id: 'lastName',  label: 'Last Name*',     autoComplete: 'family-name' },
//                   { id: 'country',   label: 'Country / Region*', autoComplete: 'country-name' },
//                   { id: 'line1',    label: 'line1*',    autoComplete: 'line1' },
//                   { id: 'line2',    label: 'line2*',    autoComplete: 'line2' },
//                   { id: 'city',      label: 'City / Ward*',       autoComplete: 'address-level2' },
//                   { id: 'state',     label: 'Prefecture*',        autoComplete: 'address-level1' },
//                   { id: 'zip',       label: 'Postal Code*',       autoComplete: 'postal-code' },
//                   { id: 'phone',     label: 'Phone*', type: 'tel', autoComplete: 'tel' },
//                 ].map(({ id, label, type = 'text', autoComplete }) => (
//                   <div className="single-input" key={id}>
//                     <label htmlFor={id}>{label}</label>
//                     <input
//                       id={id}
//                       type={type}
//                       autoComplete={autoComplete}
//                       value={(billingInfo as any)[id]}
//                       onChange={handleInputChange}
//                       required={id !== 'line2'}
//                     />
//                   </div>
//                 ))}

//                 <div className="single-input">
//                   <label htmlFor="orderNotes">Order Notes</label>
//                   <textarea
//                     id="orderNotes"
//                     value={billingInfo.orderNotes}
//                     onChange={handleInputChange}
//                   />
//                 </div>

//                 <button type="submit" className="rts-btn btn-primary">
//                   Save Billing
//                 </button>
//               </form>
//             </div>
//           </div>

//           {/* Right: Order Summary */}
//           <div className="col-lg-4 order-1 order-xl-2">
//             <h3 className="title-checkout">Your Order</h3>
//             <div className="right-card-sidebar-checkout">
//               <div className="top-wrapper">
//                 <div className="product">Products</div>
//                 <div className="price">Price</div>
//               </div>

//               {!items || items.length === 0 ? (
//                 <p>Your cart is empty.</p>
//               ) : (
//                 items.map(({ product, quantity }) => (
//                   <div className="single-shop-list" key={String(product.id ?? product.slug)}>
//                     <div className="left-area">
//                       {/* eslint-disable-next-line @next/next/no-img-element */}
//                       <img src={product.image} alt={product.title || product.slug} />
//                       <span className="title">
//                         {product.title ?? product.slug} × {quantity}
//                       </span>
//                     </div>
//                     <span className="price">
//                       {currency.format(coerceNumberPrice(product.price) * (Number(quantity) || 0))}
//                     </span>
//                   </div>
//                 ))
//               )}

//               <div className="single-shop-list">
//                 <div className="left-area">
//                   <span>Subtotal</span>
//                 </div>
//                 <span className="price">{currency.format(subtotal)}</span>
//               </div>

//               <div className="single-shop-list">
//                 <div className="left-area">
//                   <span>Shipping</span>
//                 </div>
//                 <span className="price">
//                   {shippingCost === 0 ? 'Free' : currency.format(shippingCost)}
//                 </span>
//               </div>

//               <div className="single-shop-list">
//                 <div className="left-area">
//                   <span style={{ fontWeight: 600, color: '#2C3C28' }}>Total Price:</span>
//                 </div>
//                 <span className="price" style={{ color: '#629D23' }}>
//                   {currency.format(total)}
//                 </span>
//               </div>

//               {/* Payment methods (kept same) */}
//               <div className="cottom-cart-right-area">
//                 <ul>
//                   <li>
//                     <input type="radio" id="bank" name="payment" />
//                     <label htmlFor="bank">Direct Bank Transfer</label>
//                   </li>
//                   <li>
//                     <input type="radio" id="check" name="payment" />
//                     <label htmlFor="check">Check Payments</label>
//                   </li>
//                   <li>
//                     <input type="radio" id="cod" name="payment" />
//                     <label htmlFor="cod">Cash On Delivery</label>
//                   </li>
//                   <li>
//                     <input type="radio" id="paypal" name="payment" />
//                     <label htmlFor="paypal">Paypal</label>
//                   </li>
//                 </ul>
//                 <div className="single-category mb--30">
//                   <input id="terms" type="checkbox" required />
//                   <label htmlFor="terms"> I have read and agree to terms and conditions *</label>
//                 </div>
//                 <a href="#" className="rts-btn btn-primary">Place Order</a>
//               </div>
//             </div>

//             <p style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
//               Free delivery on orders ≥ {currency.format(FREE_SHIPPING_THRESHOLD)}.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCart } from '@/components/header/CartContext';
import { toast } from 'react-toastify';
import { createOrder } from '@/lib/orderApi';
import { saveCartToDb } from '@/lib/cartApi';

const DEFAULT_SHIPPING_COST = 800;
const FREE_SHIPPING_THRESHOLD = 59.69;

const currency = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
});

function coerceNumberPrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default function CheckOutMain() {
  // ---- Auth ----
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const callbackUrl = encodeURIComponent(pathname || '/');
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [loading, user, router, pathname]);

  // ---- Cart ----
  const { items, isLoaded, clear } = useCart();

  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, entry) => {
      const price = coerceNumberPrice(entry.product?.price);
      const qty = Number(entry.quantity || 0);
      return sum + price * qty;
    }, 0);
  }, [items]);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
  const total = subtotal + shippingCost;

  // ---- Billing ----
  const [billingInfo, setBillingInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    country: 'Japan',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    orderNotes: '',
  });

  useEffect(() => {
    if (user) {
      setBillingInfo((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: (user as any).first_name || prev.firstName,
        lastName: (user as any).last_name || prev.lastName,
        country: prev.country || 'Japan',
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [id]: value }));
  };

  // ---- Payment ----
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'credit_card'>('cod');

  // ---- Place Order ----
//   const handlePlaceOrder = async () => {
//     try {
//       if (!items.length) {
//         toast.error("Your cart is empty");
//         return;
//       }

//       const payload = {
//         items: items.map((i) => ({
//           product: i.product.id,
//           quantity: i.quantity,
//         })),
//         billing: billingInfo,
//         paymentMethod: selectedPaymentMethod,
//       };
//         console.log("Payload is : ", payload)
//       const order = await createOrder(payload);

//       toast.success("Order placed successfully!");
//       clear(); // clear local cart
//       router.push(`/order/${order.id}`); // adjust to your order detail route
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Failed to place order");
//     }
//   };
    const handlePlaceOrder = async () => {
    try {
        if (!items.length) {
        toast.error("Your cart is empty");
        return;
        }

        // Step 1: Save cart to DB
        const cartPayload = items.map((i) => ({
        product: i.product.id,
        quantity: i.quantity,
        }));
        await saveCartToDb(cartPayload);

        // Step 2: Place order with billing + payment
        const orderPayload = {
        items: cartPayload,
        billing: billingInfo,
        paymentMethod: selectedPaymentMethod,
        };
        const order = await createOrder(orderPayload);

        toast.success("Order placed successfully!");
        clear(); // clear local cart
        router.push(`/order/${order.id}`); // adjust route if needed
    } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to place order");
    }
    };

  // ---- Loading states ----
  if (loading || !isLoaded) {
    return (
      <div className="checkout-area rts-section-gap">
        <div className="container"><p>Loading…</p></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="checkout-area rts-section-gap">
      <div className="container">
        <div className="row">
          {/* Left: Billing */}
          <div className="col-lg-8 pr--40 order-2 order-xl-1">
            <div className="rts-billing-details-area">
              <h3 className="title">Billing Details</h3>
              <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>
                {[
                  { id: 'email', label: 'Email Address*', type: 'email' },
                  { id: 'firstName', label: 'First Name*' },
                  { id: 'lastName', label: 'Last Name*' },
                  { id: 'country', label: 'Country / Region*' },
                  { id: 'line1', label: 'Address Line 1*' },
                  { id: 'line2', label: 'Address Line 2' },
                  { id: 'city', label: 'City / Ward*' },
                  { id: 'state', label: 'Prefecture*' },
                  { id: 'zip', label: 'Postal Code*' },
                  { id: 'phone', label: 'Phone*', type: 'tel' },
                ].map(({ id, label, type = 'text' }) => (
                  <div className="single-input" key={id}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type={type}
                      value={(billingInfo as any)[id]}
                      onChange={handleInputChange}
                      required={id !== 'line2'}
                    />
                  </div>
                ))}

                <div className="single-input">
                  <label htmlFor="orderNotes">Order Notes</label>
                  <textarea
                    id="orderNotes"
                    value={billingInfo.orderNotes}
                    onChange={handleInputChange}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="col-lg-4 order-1 order-xl-2">
            <h3 className="title-checkout">Your Order</h3>
            <div className="right-card-sidebar-checkout">
              <div className="top-wrapper">
                <div className="product">Products</div>
                <div className="price">Price</div>
              </div>

              {!items || items.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                items.map(({ product, quantity }) => (
                  <div className="single-shop-list" key={String(product.id ?? product.slug)}>
                    <div className="left-area">
                      <img src={product.image} alt={product.title || product.slug} />
                      <span className="title">
                        {product.title ?? product.slug} × {quantity}
                      </span>
                    </div>
                    <span className="price">
                      {currency.format(coerceNumberPrice(product.price) * (Number(quantity) || 0))}
                    </span>
                  </div>
                ))
              )}

              <div className="single-shop-list">
                <div className="left-area"><span>Subtotal</span></div>
                <span className="price">{currency.format(subtotal)}</span>
              </div>

              <div className="single-shop-list">
                <div className="left-area"><span>Shipping</span></div>
                <span className="price">
                  {shippingCost === 0 ? 'Free' : currency.format(shippingCost)}
                </span>
              </div>

              <div className="single-shop-list">
                <div className="left-area">
                  <span style={{ fontWeight: 600, color: '#2C3C28' }}>Total Price:</span>
                </div>
                <span className="price" style={{ color: '#629D23' }}>
                  {currency.format(total)}
                </span>
              </div>

              {/* Payment Methods: Only COD & Credit Card */}
              <div className="cottom-cart-right-area">
                <ul>
                  <li>
                    <input
                      type="radio"
                      id="cod"
                      name="payment"
                      checked={selectedPaymentMethod === 'cod'}
                      onChange={() => setSelectedPaymentMethod('cod')}
                    />
                    <label htmlFor="cod">Cash On Delivery</label>
                  </li>
                  <li>
                    <input
                      type="radio"
                      id="credit_card"
                      name="payment"
                      checked={selectedPaymentMethod === 'credit_card'}
                      onChange={() => setSelectedPaymentMethod('credit_card')}
                    />
                    <label htmlFor="credit_card">Credit Card</label>
                  </li>
                </ul>
                <div className="single-category mb--30">
                  <input id="terms" type="checkbox" required />
                  <label htmlFor="terms"> I have read and agree to terms and conditions *</label>
                </div>
                <button onClick={handlePlaceOrder} className="rts-btn btn-primary">
                  Place Order
                </button>
              </div>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
              Free delivery on orders ≥ {currency.format(FREE_SHIPPING_THRESHOLD)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
