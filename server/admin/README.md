# Admin Module

This folder contains all admin-related functionality for the Global Image application.

## Folder Structure

```
server/admin/
├── index.js          # Main admin module export
├── middleware.js     # Admin authentication middleware
├── routes.js         # Admin route definitions
├── controllers.js    # Admin business logic controllers
└── README.md        # This documentation file
```

## Files Description

### `index.js`
- Main entry point for the admin module
- Exports router and middleware
- Includes admin health check endpoint

### `middleware.js`
- Admin authentication middleware
- JWT token verification
- Admin role validation

### `routes.js`
- Admin route definitions
- Organized by functionality:
  - Dashboard Statistics
  - User Management
  - Gallery Management
  - Service Management
  - System Information
  - Analytics & Reports

### `controllers.js`
- Business logic for admin operations
- Separated from routes for better organization
- Includes all CRUD operations for admin functions

## API Endpoints

### Dashboard & Statistics
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/analytics` - Detailed analytics

### User Management
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user

### Gallery Management
- `GET /api/admin/galleries` - List all galleries
- `DELETE /api/admin/galleries/:id` - Delete gallery

### Service Management
- `GET /api/admin/services` - List all services
- `DELETE /api/admin/services/:id` - Delete service

### System Information
- `GET /api/admin/system-info` - System status and info
- `GET /api/admin/health` - Admin API health check

## Authentication

All admin endpoints require:
- Valid JWT token in Authorization header
- Admin role verification
- Token format: `Bearer <token>`

## Usage

```javascript
// In main server file
const adminModule = require('./admin');
app.use('/api/admin', adminModule.router);

// Using admin middleware in other routes
const { adminAuth } = require('./admin');
router.get('/protected', adminAuth, (req, res) => {
  // Admin-only route
});
```

## Security Features

- JWT-based authentication
- Admin role verification
- Protected routes with middleware
- Error handling for unauthorized access
- Secure token validation

## Error Handling

All admin endpoints include:
- Proper error responses
- Logging for debugging
- Consistent error message format
- HTTP status codes

## Development Notes

- Controllers are separated from routes for better testing
- Middleware is reusable across admin functions
- All admin operations are logged for audit purposes
- Database operations include proper error handling 