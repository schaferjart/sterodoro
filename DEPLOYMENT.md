# 🚀 Sterodoro Deployment Guide

## **📋 Pre-Deployment Checklist**

### **✅ Required Files**
- [x] `.env.local` with Supabase credentials
- [x] PWA configuration in `vite.config.ts`
- [x] Service worker in `public/sw.js`
- [x] Build script in `package.json`

### **🔧 Missing: PWA Icons**
We need to add PWA icons for the app to be installable:

```bash
# Create these files in the public/ directory:
public/icon-192.png  # 192x192 pixels
public/icon-512.png  # 512x512 pixels
```

## **🌐 GitHub Deployment**

### **1. Initialize Git (if not already done)**
```bash
git init
git add .
git commit -m "Initial commit: Sterodoro PWA with offline sync"
```

### **2. Create GitHub Repository**
```bash
git remote add origin https://github.com/YOUR_USERNAME/sterodoro.git
git branch -M main
git push -u origin main
```

### **3. Add Environment Variables to GitHub**
- Go to your GitHub repo → Settings → Secrets and variables → Actions
- Add these repository secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## **🚀 Vercel Deployment**

### **1. Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Vercel will auto-detect it's a Vite app

### **2. Configure Environment Variables**
In Vercel dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://gpkxqsqqiemkvhcykcxw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **3. Build Settings**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### **4. Deploy**
- Click "Deploy"
- Vercel will build and deploy your app

## **📱 PWA Installation**

### **On Mobile:**
1. Open the deployed URL on your phone
2. Look for "Add to Home Screen" prompt
3. Or manually: Share → Add to Home Screen

### **On Desktop:**
1. Open the deployed URL in Chrome
2. Look for the install icon in the address bar
3. Click "Install Sterodoro"

## **🧪 Testing Checklist**

### **✅ Core Features**
- [ ] Timer works offline
- [ ] Data syncs when online
- [ ] Delete operations persist
- [ ] Sound notifications work
- [ ] Mobile UI is responsive

### **✅ PWA Features**
- [ ] App installs on phone
- [ ] Works offline
- [ ] Background sync works
- [ ] Push notifications (future)

### **✅ Authentication**
- [ ] Sign up works
- [ ] Sign in works
- [ ] Data is user-specific
- [ ] Sync works per user

## **🔧 Troubleshooting**

### **If PWA doesn't install:**
- Check that icons exist in `public/`
- Verify manifest.json is valid
- Check service worker registration

### **If sync doesn't work:**
- Verify Supabase credentials in Vercel
- Check browser console for errors
- Ensure user is authenticated

### **If offline doesn't work:**
- Check service worker registration
- Verify IndexedDB is working
- Check workbox configuration

## **🎉 Success!**

Once deployed, your Sterodoro app will be:
- ✅ **Installable** on phones and desktops
- ✅ **Offline-capable** with local storage
- ✅ **Multi-user** with Supabase auth
- ✅ **Auto-syncing** when online
- ✅ **Mobile-optimized** UI

**Ready to deploy! 🚀** 