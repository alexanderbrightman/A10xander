# Deployment Guide - A10xander.com

## Setting Up Your Domain on Vercel

### Step 1: Add Domain in Vercel Dashboard

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Click on your **A10xander** project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain: `a10xander.com` (or `www.a10xander.com` if you prefer)
6. Click **Add**

### Step 2: Get DNS Configuration from Vercel

After adding the domain, Vercel will show you the DNS records you need to configure:

**For apex domain (a10xander.com):**
- **Type**: `A` record
- **Name**: `@` (or leave blank, depending on your DNS provider)
- **Value**: Vercel will provide an IP address (e.g., `76.76.21.21`)

**OR use CNAME (recommended for subdomains):**
- **Type**: `CNAME` record  
- **Name**: `@` (for apex) or `www` (for www subdomain)
- **Value**: `cname.vercel-dns.com.`

**Note**: Some DNS providers don't support CNAME on apex domains. If yours doesn't, use the A record.

### Step 3: Configure DNS at Your Domain Registrar

The steps vary by registrar. Here are common ones:

#### **Cloudflare**
1. Log in to Cloudflare
2. Select your domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. For apex domain:
   - **Type**: `A`
   - **Name**: `@`
   - **IPv4 address**: (from Vercel)
   - **Proxy status**: (orange cloud) - optional, recommended
6. For www subdomain:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `cname.vercel-dns.com.`
   - **Proxy status**: (orange cloud) - optional
7. Click **Save**

#### **Namecheap**
1. Log in to Namecheap
2. Go to **Domain List** → click **Manage** next to your domain
3. Go to **Advanced DNS** tab
4. Click **Add New Record**
5. For apex domain:
   - **Type**: `A Record`
   - **Host**: `@`
   - **Value**: (IP from Vercel)
   - **TTL**: `Automatic`
6. For www:
   - **Type**: `CNAME Record`
   - **Host**: `www`
   - **Value**: `cname.vercel-dns.com.`
   - **TTL**: `Automatic`
7. Click **Save All Changes**

#### **GoDaddy**
1. Log in to GoDaddy
2. Go to **My Products** → **DNS** (next to your domain)
3. Click **Add** in the Records section
4. For apex domain:
   - **Type**: `A`
   - **Name**: `@`
   - **Value**: (IP from Vercel)
   - **TTL**: `600 seconds`
5. For www:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com.`
   - **TTL**: `600 seconds`
6. Click **Save**

#### **Google Domains / Squarespace Domains**
1. Log in to your domain registrar
2. Navigate to DNS settings
3. Add the A record for `@` pointing to Vercel's IP
4. Add CNAME record for `www` pointing to `cname.vercel-dns.com.`

### Step 4: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes** for most providers
- You can check propagation status at: https://dnschecker.org

### Step 5: Verify in Vercel

1. Go back to Vercel → **Settings** → **Domains**
2. You should see a status indicator:
   - ⏳ **Pending** - DNS not yet configured
   - ✅ **Valid** - Domain is configured correctly
   - ❌ **Invalid** - Check your DNS settings

### Step 6: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt:
- Happens automatically once DNS is configured
- Usually takes 1-5 minutes after DNS is valid
- Your site will be available at `https://a10xander.com`

## Recommended Setup

For best results, configure both:

1. **Apex domain** (`a10xander.com`):
   - Use **A record** pointing to Vercel's IP
   - OR use **ALIAS/ANAME** if your DNS provider supports it

2. **WWW subdomain** (`www.a10xander.com`):
   - Use **CNAME** pointing to `cname.vercel-dns.com.`
   - Vercel will automatically redirect www → apex (or vice versa)

## Troubleshooting

### Domain not resolving?
- Check DNS propagation: https://dnschecker.org
- Verify records are correct in your DNS provider
- Wait up to 48 hours for full propagation

### SSL certificate not issued?
- Ensure DNS is properly configured
- Wait a few minutes after DNS is valid
- Check Vercel dashboard for SSL status

### Want to redirect www to apex (or vice versa)?
- Vercel handles this automatically
- Or configure in Vercel → Settings → Domains → Configure

## Environment Variables

Don't forget to add your environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add all variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SECRET_PASSWORD`
   - `ADMIN_UUID` (optional, already hardcoded)

## After Deployment

Once DNS is configured and SSL is active:
- Your site will be live at `https://a10xander.com`
- Vercel automatically handles HTTPS
- All traffic is encrypted


