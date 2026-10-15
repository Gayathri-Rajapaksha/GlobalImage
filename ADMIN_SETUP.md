# Global Image Admin Panel Setup

## Admin Access

An administrator account must be created using the secure seeding script or configured in `server/.env`:

```bash
cd server
npm run seed:admin
```

This ensures admin passwords are securely hashed using bcrypt and stored in MongoDB rather than being hardcoded in application files.

## Project Structure

### Backend Organization
```
server/
├── admin/                    # Admin module (organized separately)
│   ├── index.js             # Main admin module export
│   ├── middleware.js        # Admin authentication middleware
│   ├── routes.js            # Admin route definitions
│   ├── controllers.js       # Admin business logic
│   └── README.md           # Admin module documentation
├── routes/                  # Regular application routes
│   ├── auth.js             # Authentication routes
│   ├── gallery.js          # Gallery routes
│   └── services.js         # Service routes
├── models/                  # Database models
└── index.js                # Main server file
```

## Features

### Admin Dashboard (`/admin`)
- **Statistics Overview:** View total galleries, services, users, and recent activity
- **Quick Actions:** Direct access to add galleries, manage services, generate reports
- **System Information:** Monitor system status, database connection, and uptime
- **Recent Activity:** Quick access to management functions

### Admin Functions
1. **Gallery Management**
   - Add new galleries with photos
   - Update existing galleries
   - Delete galleries
   - Generate monthly reports (PDF/Excel)

2. **Service Management**
   - Add new service packages
   - Update service details and pricing
   - Delete services
   - Generate service reports

3. **User Management**
   - View registered users
   - Delete users (admin only)

4. **Reports & Analytics**
   - Monthly gallery reports
   - Service statistics
   - Download reports in PDF/Excel format

## Access Instructions

1. **Start the application:**
   ```bash
   # Start backend server
   cd server
   npm start
   
   # Start frontend (in new terminal)
   cd client
   npm start
   ```

2. **Sign in as admin:**
   - Go to `/signin` or click "Sign in" in the navigation
   - Enter email: `admin@global.com`
   - Enter password: `global1234`
   - Click "Sign In"

3. **Access admin dashboard:**
   - After successful login, you'll be redirected to `/admin`
   - Or click "ADMIN DASHBOARD" in the navigation bar

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Admin Middleware:** Backend protection for admin-only routes
- **Role-based Access:** Different permissions for admin vs regular users
- **Session Management:** Automatic logout and session handling

## API Endpoints

### Admin Routes (`/api/admin`)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/analytics` - Detailed analytics
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/galleries` - List all galleries
- `DELETE /api/admin/galleries/:id` - Delete gallery
- `GET /api/admin/services` - List all services
- `DELETE /api/admin/services/:id` - Delete service
- `GET /api/admin/system-info` - System information
- `GET /api/admin/health` - Admin API health check

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Navigation

When logged in as admin, you'll see:
- **ADMIN DASHBOARD** link in the navigation
- **Logout** button
- Admin-specific features on portfolio and services pages

## Code Organization

### Admin Module Structure
The admin functionality is now organized in a separate `server/admin/` folder:

- **`index.js`** - Main module export and health check
- **`middleware.js`** - Authentication and authorization
- **`routes.js`** - Route definitions (clean and organized)
- **`controllers.js`** - Business logic (separated from routes)

### Benefits of New Structure
- **Better Organization:** Admin code is isolated and organized
- **Separation of Concerns:** Routes, controllers, and middleware are separate
- **Maintainability:** Easier to maintain and extend admin features
- **Reusability:** Middleware and controllers can be reused
- **Testing:** Easier to write unit tests for individual components

## Troubleshooting

1. **Can't access admin panel:**
   - Ensure you're using the correct credentials
   - Check that both frontend and backend are running
   - Clear browser cache and try again

2. **Statistics not loading:**
   - Check MongoDB connection
   - Verify backend server is running on port 5050
   - Check browser console for errors

3. **Authentication issues:**
   - Clear localStorage: `localStorage.clear()`
   - Restart the application
   - Check JWT token in browser dev tools

4. **Admin routes not working:**
   - Verify admin folder structure is correct
   - Check that admin module is properly imported in server/index.js
   - Ensure all admin files are in the correct location

## Development Notes

- Admin credentials are authenticated against the database with bcrypt password hashing
- JWT tokens are used for session management
- All admin routes are protected with middleware
- Frontend automatically redirects non-admin users away from admin pages
- Admin module is organized separately for better maintainability
- Controllers are separated from routes for better testing and organization 