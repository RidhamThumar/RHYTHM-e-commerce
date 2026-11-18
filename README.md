<div align="center">

# RHYTHM

### Premium Fashion E-commerce Experience

**A modern, full-stack fashion storefront with customer accounts, inventory management, and an admin dashboard.**

`Next.js` Â· `TypeScript` Â· `Supabase` Â· `PostgreSQL` Â· `Prisma`

</div>

---

## Overview

RHYTHM is a portfolio demonstration of a fashion e-commerce platform. It combines an editorial-style shopping interface with database-backed product management, customer authentication, shopping features, and store administration.

The experience is designed to showcase the development of custom online storefronts for fashion and lifestyle brands.

> **Portfolio demo:** Payments and refunds are simulated. No real card charges, shipping, or deliveries take place. Some supporting workflows are demonstrations rather than production integrations.

## Key features

| Storefront and shopping | Accounts and operations |
| --- | --- |
| Responsive homepage and product catalog | Supabase email verification and password + email OTP login |
| Product details, search, filters, and sorting | Customer profiles, addresses, and order history |
| Cart and wishlist | Admin-only dashboard and customer overview |
| Size and stock availability | Product, variant, and inventory management |
| Simulated checkout and refund workflow | Order statuses and coupon record management |
| Minimal luxury visual design | Branded order and refund email templates |

**Important limitations:** Coupon redemption at checkout, real payment gateway integration, shipping-carrier integration, and automatic shipping/delivery notifications are not connected. The contact form is a UI demonstration and does not send messages.

## Screenshots

Screenshots of the real RHYTHM interface will be added here after the live demo is verified. Recommended captures: homepage, catalog, product detail, cart/checkout, and admin dashboard.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, CSS
- **Data:** Supabase PostgreSQL, Prisma 7 with PostgreSQL driver adapter
- **Authentication:** Supabase Auth, signup verification, and email OTP login
- **Email:** Nodemailer with server-side SMTP for order and refund notifications; Supabase SMTP for auth messages
- **Hosting target:** Vercel

## Local development

Requires a supported Node.js 22 version and a configured Supabase project.

```bat
npm.cmd install
copy .env.example .env
```

Fill in `.env` with your own credentials (never commit it). Then:

```bat
npx.cmd prisma validate
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

Open http://localhost:3000.

**Do not run `prisma db push`, migrations, or the seed script against an existing populated database without reviewing the changes and backing up data.**

More details: [Deployment](docs/deployment.md), [Authentication](docs/authentication.md), [Database](docs/database.md), [Email setup](docs/email-setup.md). Historical development notes are retained in [`docs/archive/`](docs/archive/).

## Security and demo scope

- Admin access is restricted by account role and server-side email allowlist.
- Private configuration belongs in `.env` / hosting environment variables, never in the repository.
- Checkout uses a **simulated payment provider**, not Stripe or Razorpay.
- This is not a production commerce service or a security certification; live deployment requires secret rotation, access-control checks, and end-to-end regression testing.

## Freelance inquiries

**Built by Ridhamkumar Thumar â€” AI Engineer & Full-Stack Developer.**

I develop custom websites, e-commerce experiences, AI integrations, chatbots, and business automation solutions.

- **Email:** [ridhamkumarthumar@gmail.com](mailto:ridhamkumarthumar@gmail.com)
- **WhatsApp:** [+91 87800 27805](https://wa.me/918780027805)
- **LinkedIn:** [Ridhamkumar Thumar](https://www.linkedin.com/in/ridhamkumar-thumar/)

Interested in a similar website for your business? Get in touch to discuss your requirements.

---

<sub>RHYTHM is a fictional fashion-brand portfolio demonstration. Product imagery and brand language are illustrative.</sub>
