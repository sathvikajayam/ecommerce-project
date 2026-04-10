# Admin Management System Documentation

## Overview
This document explains the Admin Management System with Role-Based Access Control (RBAC) implemented in the React E-Commerce application.

## Features

### 1. **Admin User Management**
- Create new admin users
- Edit existing admin permissions
- Remove admin status from users
- Delete admin users completely

### 2. **Permission Control**
Granular permission management across 5 main resources:
- **Products**: View, Create, Edit, Delete
- **Brands**: View, Create, Edit, Delete
- **Categories**: View, Create, Edit, Delete
- **Users**: View, Create, Edit, Delete
- **Admin**: View, Create, Edit, Delete (for managing other admins)

### 3. **Enhanced Backend Validation**
- Email format validation
- Permission structure validation
- Immutable email field (cannot be changed after creation)
- Name update capability
- Automatic password generation if not provided

## File Structure

### Backend
```
backend/
├── routes/
│   └── adminUserRoutes.js (Enhanced with validation)
├── models/
│   └── User.js (Includes permissions schema)
└── server.js
```

### Frontend
```
frontend/src/
├── pages/admin/
│   ├── AdminAdmins.jsx (List & manage admins)
│   ├── AdminAddUser.jsx (Create new admin)
│   └── EditAdmin.jsx (Edit admin permissions) - NEW
├── service/
│   └── permissionsService.js (Permissions utilities) - NEW
└── styles/
    └── AdminUsers.css (Updated with edit button styles)
```

## API Endpoints

### 1. **GET /api/admin/users**
Fetch all admin users
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/admin/users
```

### 2. **GET /api/admin/users/:id**
Fetch single admin user by ID
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/admin/users/USER_ID
```

### 3. **POST /api/admin/users**
Create new admin user
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "optional_password",
    "isAdmin": true,
    "permissions": {
      "products": { "view": true, "create": true, "edit": true, "delete": false },
      "brands": { "view": true, "create": false, "edit": false, "delete": false },
      "categories": { "view": true, "create": false, "edit": false, "delete": false },
      "users": { "view": true, "create": false, "edit": false, "delete": false },
      "admin": { "view": false, "create": false, "edit": false, "delete": false }
    }
  }'
```

### 4. **PUT /api/admin/users/:id**
Update admin user (name and/or permissions)
```bash
curl -X PUT http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "permissions": {
      "products": { "view": true, "create": true, "edit": true, "delete": true },
      "brands": { "view": true, "create": true, "edit": true, "delete": false },
      "categories": { "view": true, "create": true, "edit": true, "delete": false },
      "users": { "view": true, "create": false, "edit": false, "delete": false },
      "admin": { "view": true, "create": false, "edit": false, "delete": false }
    }
  }'
```

### 5. **DELETE /api/admin/users/:id**
Delete admin user
```bash
curl -X DELETE http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

## Frontend Components

### AdminAdmins.jsx
**Purpose**: Display list of all admin users
**Features**:
- Search functionality
- View all admin details
- Edit permissions button
- Remove admin status button
- Delete admin button

**Usage**: Navigate to `/admin/admins`

### AdminAddUser.jsx
**Purpose**: Create new admin user with initial permissions
**Features**:
- Form validation
- Permissions matrix
- Automatic password generation
- Email validation

**Usage**: Navigate to `/admin/users/add` or click "Add New Admin" button

### EditAdmin.jsx (NEW)
**Purpose**: Edit existing admin permissions and name
**Features**:
- Load existing admin details
- Update permissions
- Update name (email is read-only for security)
- Comprehensive permissions matrix
- Full validation

**Usage**: Navigate to `/admin/admins/edit/:id` or click "Edit Permissions" button

## Permissions Service

### Location
`frontend/src/service/permissionsService.js`

### Available Functions

#### Permission Utilities
```javascript
// Check if user has specific permission
hasPermission(permissions, resource, action)

// Grant all permissions for a resource
grantAllResourcePermissions(permissions, resource)

// Revoke all permissions for a resource
revokeAllResourcePermissions(permissions, resource)

// Grant all permissions (full access)
grantAllPermissions(permissions)

// Revoke all permissions (no access)
revokeAllPermissions(permissions)

// Get permission summary stats
getPermissionsSummary(permissions)
```

#### API Functions
```javascript
// Fetch all admins
fetchAllAdmins()

// Fetch single admin by ID
fetchAdminById(id)

// Create new admin
createAdmin(adminData)

// Update admin
updateAdmin(id, updateData)

// Delete admin
deleteAdmin(id)

// Remove admin status
removeAdminStatus(id)
```

### Example Usage
```javascript
import permissionsService from './service/permissionsService';

// Check permission
if (permissionsService.hasPermission(admin.permissions, 'products', 'edit')) {
  console.log('Admin can edit products');
}

// Grant permissions
const updated = permissionsService.grantAllResourcePermissions(
  admin.permissions, 
  'products'
);

// Get summary
const summary = permissionsService.getPermissionsSummary(admin.permissions);
console.log(`Admin has ${summary.percentage}% permissions granted`);
```

## User Flow

### Creating a New Admin
1. Navigate to Admin Panel → Admin Management
2. Click "Add New Admin" button
3. Fill in name and email
4. Select desired permissions from the matrix
5. Click "Add Admin"
6. A temporary password will be generated and displayed
7. Share credentials securely with the new admin

### Editing Admin Permissions
1. Navigate to Admin Panel → Admin Management
2. Find the admin in the list
3. Click "Edit Permissions" button
4. Update name if needed (email cannot be changed)
5. Toggle permissions as needed
6. Click "Update Admin"
7. Changes take effect immediately

### Removing Admin Status
1. Navigate to Admin Panel → Admin Management
2. Find the admin in the list
3. Click "Remove Admin" button
4. Confirm the action
5. User will be downgraded to regular user status

### Deleting an Admin
1. Navigate to Admin Panel → Admin Management
2. Find the admin in the list
3. Click "Delete" button
4. Confirm the action
5. Admin account will be permanently deleted

## Permission Matrix

| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Products | ✓    | ✓      | ✓    | ✓      |
| Brands   | ✓    | ✓      | ✓    | ✓      |
| Categories | ✓  | ✓      | ✓    | ✓      |
| Users    | ✓    | ✓      | ✓    | ✓      |
| Admin    | ✓    | ✓      | ✓    | ✓      |

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed, required),
  isAdmin: Boolean (default: false),
  permissions: {
    products: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    brands: { ... },
    categories: { ... },
    users: { ... },
    admin: { ... }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

1. **Email Immutability**: Email cannot be changed after account creation
2. **Password Hashing**: All passwords are hashed using bcryptjs
3. **Token-Based Auth**: All API calls require admin token
4. **Permission Validation**: Server-side validation of all permission requests
5. **Audit Trail**: All actions are logged with timestamps

## Best Practices

1. **Regular Audits**: Periodically review admin permissions
2. **Least Privilege**: Grant only necessary permissions to each admin
3. **Strong Passwords**: Encourage admins to change default passwords immediately
4. **Email Validation**: Verify email addresses before adding admins
5. **Clean Up**: Remove permissions when admins change roles

## Troubleshooting

### Issue: Cannot create admin
**Solution**: Ensure email is unique and valid format

### Issue: Permissions not updating
**Solution**: Verify permission structure matches expected format

### Issue: Edit page shows "Admin not found"
**Solution**: Ensure admin ID is valid and admin exists

### Issue: API returns 400 error
**Solution**: Check request body format and ensure all required fields are present

## Testing the System

### Manual Testing Checklist
- [ ] Create new admin with specific permissions
- [ ] Navigate to admin details page
- [ ] Edit admin name
- [ ] Toggle individual permissions
- [ ] Grant/revoke all permissions for a resource
- [ ] Remove admin status
- [ ] Delete admin completely
- [ ] Search for admin by name/email
- [ ] Verify permissions take effect immediately

## Future Enhancements

1. **Bulk Permission Management**: Grant permissions to multiple admins at once
2. **Permission Presets**: Create predefined permission templates (e.g., "Product Manager", "Store Manager")
3. **Audit Logging**: Track all permission changes
4. **Two-Factor Authentication**: Add 2FA for admin accounts
5. **Role-Based Access**: Create predefined roles instead of per-admin permissions
6. **Permission Inheritance**: Parent permissions for hierarchical access

## Support

For issues or feature requests, please contact the development team.
