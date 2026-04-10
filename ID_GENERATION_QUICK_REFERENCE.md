# ID Generation - Quick Reference Guide

## 🎯 Current IDs Status

| Type | Format | Count | Range | Next ID |
|------|--------|-------|-------|---------|
| Product | PRD-XXXX | 30 | PRD-0001 to PRD-0030 | PRD-0031 |
| Category | CATXXX | 9 | CAT001 to CAT009 | CAT010 |
| Brand | BRDXXX | 8 | BRD001 to BRD008 | BRD009 |

---

## 📌 How It Works

### For New Product Creation
The system **automatically** generates Product IDs when you create a new product:
- No manual ID assignment needed
- IDs are sequential (PRD-0001, PRD-0002, etc.)
- Next product will be: **PRD-0031**

### For New Category Creation
The system **automatically** generates Category IDs:
- Next category will be: **CAT010**

### For New Brand Creation
The system **automatically** generates Brand IDs:
- Next brand will be: **BRD009**

---

## 🔍 Finding Products/Categories/Brands by ID

### Database Queries
```javascript
// Find product by ID
db.products.findOne({ productId: "PRD-0015" })

// Find category by ID
db.categories.findOne({ categoryId: "CAT005" })

// Find brand by ID
db.brands.findOne({ brandId: "BRD003" })
```

### API Endpoints
Products: `/api/products/:id` (uses MongoDB _id)
Categories: `/api/categories/:id` (uses MongoDB _id)
Brands: `/api/brands/:id` (uses MongoDB _id)

---

## ✅ What's Implemented

✓ All 30 existing products have PRD-XXXX IDs  
✓ All 9 existing categories have CATXXX IDs  
✓ All 8 existing brands have BRDXXX IDs  
✓ Auto-generation works for new products  
✓ Auto-generation works for new categories  
✓ Auto-generation works for new brands  
✓ Backfill script has been executed  

---

## 📊 No Action Needed!

The implementation is **complete and working**. The system will:
- Automatically assign the next ID when you create new items
- Continue the sequence from where it left off
- Manage all ID generation without manual intervention

---

## 🔧 If You Need to Reset (Not Recommended)

To reset ID sequences (start over from PRD-0001, CAT001, BRD001):

```bash
# Delete counter collection to reset
db.counters.deleteMany({})

# Backfill IDs again
node scripts/backfillIds.js
```

⚠️ **Warning**: This will reset ALL ID sequences and should only be done if you've cleared the database.

---

## 📝 Sample Data

### Product Example
```json
{
  "_id": "699724214f526b1c329eebe6",
  "productId": "PRD-0001",
  "title": "Fjallraven - Foldsack No. 1 Backpack",
  "price": 109.95,
  "category": "electronics",
  "brand": "Adidas"
}
```

### Category Example
```json
{
  "_id": "699874a50450cd1be5a94145",
  "categoryId": "CAT001",
  "name": "electronics",
  "slug": "electronics",
  "status": "active"
}
```

### Brand Example
```json
{
  "_id": "699865e309fe32c4bde62826",
  "brandId": "BRD001",
  "name": "Adidas",
  "slug": "adidas",
  "status": "active"
}
```

---

## 📞 For Reference

- **Backfill Script**: `backend/scripts/backfillIds.js`
- **ID Generator**: `backend/utils/idGenerator.js`
- **Verification Script**: `backend/verifyIds.js`
- **Detailed Documentation**: `ID_GENERATION_SUMMARY.md`
