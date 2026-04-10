# Admin Management Quick Reference

## Quick Start

### Access Admin Management
1. **URL**: `http://localhost:3000/admin/admins` (after login)
2. **Sidebar**: Click on "👥 Admins" menu item

## Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| AdminAdmins | `admin/AdminAdmins.jsx` | List all admins |
| AdminAddUser | `admin/AdminAddUser.jsx` | Create new admin |
| EditAdmin | `admin/EditAdmin.jsx` | Edit admin permissions |

## Common Tasks

### Create Admin
```javascript
// Using permissionsService
import permissionsService from '../service/permissionsService';

const newAdmin = {
  name: "Product Manager",
  email: "manager@example.com",
  isAdmin: true,
  permissions: {
    products: { view: true, create: true, edit: true, delete: false },
    brands: { view: true, create: false, edit: false, delete: false },
    categories: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    admin: { view: false, create: false, edit: false, delete: false }
  }
};

const result = await permissionsService.createAdmin(newAdmin);
```

### Update Admin Permissions
```javascript
const updated = await permissionsService.updateAdmin(adminId, {
  permissions: {
    products: { view: true, create: true, edit: true, delete: true },
    brands: { view: true, create: true, edit: true, delete: false },
    categories: { view: true, create: true, edit: true, delete: false },
    users: { view: true, create: false, edit: false, delete: false },
    admin: { view: true, create: false, edit: false, delete: false }
  }
});
```

### Grant All Permissions
```javascript
const allAccess = permissionsService.grantAllPermissions(admin.permissions);
await permissionsService.updateAdmin(adminId, { permissions: allAccess });
```

### Check Admin Permission
```javascript
if (permissionsService.hasPermission(admin.permissions, 'products', 'delete')) {
  // Admin can delete products
}
```

## Permission Levels

### Minimal (Viewer)
- View only permissions for one resource

### Basic (Editor)
- View + Create + Edit for specific resources

### Advanced (Manager)
- View + Create + Edit + Delete for multiple resources

### Full Admin
- All permissions on all resources

## API Endpoints Quick Ref

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/users` | Get all admins |
| GET | `/api/admin/users/:id` | Get admin details |
| POST | `/api/admin/users` | Create new admin |
| PUT | `/api/admin/users/:id` | Update admin |
| DELETE | `/api/admin/users/:id` | Delete admin |

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/admins` | AdminAdmins | Admin list |
| `/admin/users/add` | AdminAddUser | Create admin |
| `/admin/admins/edit/:id` | EditAdmin | Edit admin |

## Important Notes

⚠️ **Email cannot be changed** after admin creation (for security)
⚠️ **Default passwords** are auto-generated if not provided
⚠️ **Permissions** are checked server-side (never trust client-side checks)
⚠️ **Admin deletion** is permanent and cannot be undone

## Debugging

### Enable logging
```javascript
// In any admin component
console.log('Admin Data:', admin);
console.log('Permissions:', admin.permissions);
console.log('Summary:', permissionsService.getPermissionsSummary(admin.permissions));
```

### Check permission structure
```javascript
const isValid = permissionsService.RESOURCES.every(resource =>
  permissionsService.ACTIONS.every(action =>
    typeof admin.permissions[resource][action] === 'boolean'
  )
);
console.log('Valid format:', isValid);
```

## Success Response Example
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "isAdmin": true,
    "permissions": { ... },
    "createdAt": "2024-03-05T10:00:00Z"
  },
  "defaultPassword": "a1b2c3d4"
}
```

## Error Response Example
```json
{
  "message": "Invalid email format"
}
```

## Testing Tools

### Postman Collection
Available endpoints for testing in Postman:
- Import from backend collection
- Use Bearer token authentication
- Test all CRUD operations

### Browser DevTools
- Network tab: Monitor API calls
- Console: Check errors and logs
- Application: Verify token storage

## Performance Tips

1. Use `fetchAdminById` instead of loading full list for single admin
2. Cache admin data when possible
3. Debounce search input
4. Use pagination for large admin lists (future enhancement)

## Security Reminders

✓ Always validate email format
✓ Check permissions server-side
✓ Use HTTPS in production
✓ Regularly rotate admin credentials
✓ Log all permission changes
✓ Implement rate limiting on API endpoints
