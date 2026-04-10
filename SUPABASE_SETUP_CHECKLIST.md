# Supabase Setup & Testing Checklist

## ✅ Supabase Configuration

### Bucket Setup
- [x] Bucket name: `Ecommerce` (confirm in Supabase console)
- [x] Folder structure created:
  - `brand-logo/` → For brand logos
  - `category-image/` → For category images  
  - `product-image/` → For product images

### Policies Configuration
Go to **Supabase Console → Storage → Ecommerce Bucket → Policies**

- [ ] **SELECT policy**: Allow public read access
  - Target: `authenticated` or `anon`
  - Operation: SELECT
  
- [ ] **INSERT policy**: Allow authenticated users to upload
  - Target: `authenticated`
  - Operation: INSERT
  
- [ ] **UPDATE policy** (optional): Allow updates
  - Target: `authenticated`
  - Operation: UPDATE

- [ ] **DELETE policy** (optional): Allow deletion
  - Target: `authenticated`
  - Operation: DELETE

---

## 🔧 Backend Configuration

### Environment Variables (.env)
```env
SUPABASE_URL=https://gzdimnhgtesuecxafczh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PRODUCT_BUCKET=Ecommerce
SUPABASE_PRODUCT_FOLDER=product-image
```

✅ **Currently set to:**
- Bucket: `Ecommerce`
- Product Folder: `product-image`
- Brand Folder: `brand-logo`
- Category Folder: `category-image`

### Route Endpoints
| Endpoint | Route | Bucket | Folder |
|----------|-------|--------|--------|
| **Admin Products** | POST `/api/admin/products` | Ecommerce | product-image |
| **Public Products** | POST `/api/products` | Ecommerce | product-image |
| **Brands** | POST `/api/admin/brands` | Ecommerce | brand-logo |
| **Categories** | POST `/api/admin/categories` | Ecommerce | category-image |

---

## 🧪 Testing Steps

### Step 1: Test Admin Add Product
1. Go to **Admin Panel** → **Products** → **Add New Product**
2. Fill in details:
   - Title: "Test Product"
   - Price: 500
   - Category: Choose any
   - Upload an image
3. Click "Add Product"
4. **Expected Result**: 
   - ✅ Product created successfully
   - ✅ Image appears in admin products list
   - ✅ Check Supabase: `Ecommerce/product-image/` folder should have the image

### Step 2: Test Public Product Display
1. Restart backend server (to reload env variables):
   ```bash
   cd React_E-Commerce/backend
   npm start
   ```
2. Go to **User Side** → **Products** page
3. **Expected Result**:
   - ✅ Product shows up in the grid
   - ✅ Product image displays correctly
   - ✅ Can click product to view details
   - ✅ Image URL in browser DevTools shows Supabase URL:
     - Format: `https://gzdimnhgtesuecxafczh.supabase.co/storage/v1/object/public/Ecommerce/product-image/...`

### Step 3: Browser DevTools Check
1. Open User Product Page
2. Press **F12** → **Network** tab
3. Refresh page and look for image requests
4. **Expected Result**:
   - ✅ Image request shows status **200**
   - ✅ Request URL starts with: `https://gzdimnhgtesuecxafczh.supabase.co`
   - ❌ NOT `http://localhost:5000/uploads/...`

### Step 4: Verify Image URLs in Database
1. Open MongoDB Compass
2. Navigate to: `react_ecommerce → products`
3. Find your test product
4. Check the `image` field:
   - ✅ Should start with: `https://gzdimnhgtesuecxafczh.supabase.co/storage/...`
   - ❌ Should NOT be: `http://localhost:5000/uploads/...`

---

## 🐛 Troubleshooting

### Images Not Showing on User Side
**Problem**: Admin shows image, but product page doesn't

**Solution Checklist**:
1. [ ] Clear browser cache (Ctrl+Shift+Delete)
2. [ ] Verify backend is restarted after .env change:
   ```bash
   # Stop previous server (Ctrl+C)
   # Then restart:
   npm start
   ```
3. [ ] Check browser console (F12) for 403/404 errors
4. [ ] Verify Supabase policies allow public READ access

### Images Return 403 Forbidden
**Problem**: Image URL exists but returns 403

**Solution**: 
- Go to Supabase Console → Storage → Ecommerce → Policies
- Add SELECT policy with `authenticated` or `anon` role
- Set policy to: `true` (allow all)

### Images Return 404
**Problem**: Image URL doesn't exist

**Solution**:
- Verify image uploaded to correct folder in Supabase
- Check folder name matches code (case-sensitive):
  - `product-image` ✅
  - `Product Image` ❌
  - `product_image` ❌

### CORS Errors in Console
**Problem**: Cross-origin error when loading Supabase images

**Solution**:
- This is normal for Supabase public URLs
- Should not block image loading
- Check browser DevTools → Application → CORS logs

---

## 📋 Complete Setup Summary

### Code Changes Made
- ✅ Updated `productRoutes.js` to use `Ecommerce` bucket + `product-image` folder
- ✅ Updated `adminProductRoutes.js` to use same bucket+folder
- ✅ Updated `categoryController.js` to upload to Supabase
- ✅ Updated `brandController.js` bucket name to `brand-logo`
- ✅ Updated `.env` file with correct folder names
- ✅ Fixed `productController.js` import path

### Next Steps for User
1. Restart backend server
2. Test admin product creation with image
3. Check user product page
4. Verify Supabase console shows uploaded images
5. Run through Troubleshooting Checklist if issues persist

---

## 📞 Quick Test Command
After making changes, test the setup:

```bash
# 1. Restart backend
cd React_E-Commerce/backend
npm start

# 2. In another terminal, test API
curl http://localhost:5000/api/products

# Expected: JSON array of products with image URLs like:
# "image": "https://gzdimnhgtesuecxafczh.supabase.co/storage/v1/object/public/Ecommerce/product-image/..."
```
