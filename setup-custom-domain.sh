#!/bin/bash

echo "🌐 Setting up NestFest with Custom Domain: nestfest.app"
echo "================================================="

CUSTOM_DOMAIN="https://nestfest.app"

echo "📋 Steps to Configure nestfest.app:"
echo ""
echo "1. 🌐 Configure Domain in Vercel:"
echo "   Go to: https://vercel.com/abel-rincons-projects/nestfest/settings/domains"
echo "   Add domain: nestfest.app"
echo "   Also add: www.nestfest.app"
echo ""

echo "2. 📡 Update DNS Records:"
echo "   In your domain registrar, set:"
echo "   A Record: @ → 76.76.19.61"
echo "   CNAME: www → cname.vercel-dns.com"
echo "   OR use Vercel nameservers: ns1.vercel-dns.com, ns2.vercel-dns.com"
echo ""

echo "3. 🔑 Update OAuth Providers:"
echo "   Google OAuth: Add $CUSTOM_DOMAIN/api/auth/callback/google"  
echo "   GitHub OAuth: Update to $CUSTOM_DOMAIN/api/auth/callback/github"
echo ""

echo "4. ⚙️  Update Vercel Environment Variables:"
echo "   Go to: https://vercel.com/abel-rincons-projects/nestfest/settings/environment-variables"
echo "   Update: NEXTAUTH_URL=$CUSTOM_DOMAIN"
echo ""

echo "5. 🚀 Deploy Updated Configuration:"
echo "   Run: git add . && git commit -m 'domain: Configure nestfest.app' && vercel --prod"
echo ""

echo "6. ✅ Test Production URLs:"
echo "   Main: $CUSTOM_DOMAIN"
echo "   Admin: $CUSTOM_DOMAIN/admin"
echo "   Judge: $CUSTOM_DOMAIN/judge"
echo ""

echo "⏱️  DNS propagation takes 5-10 minutes"
echo "🔒 SSL certificate will be auto-provisioned by Vercel"
echo "🎉 Result: Professional platform at $CUSTOM_DOMAIN"