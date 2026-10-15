# Admin Portfolio Management Guide

## 🚀 Quick Start

### 1. **Login as Admin**
- Go to: `http://localhost:3000/signin`
- Use the credentials created during setup (via `npm run seed:admin`):
  - **Email**: `admin@global.com` (or your configured admin email)
  - **Password**: Your configured administrator password

### 2. **Access Admin Portfolio**
After login, you'll be redirected to the admin dashboard. From there:
- Click **"Manage Portfolio"** button, OR
- Navigate directly to: `http://localhost:3000/admin/portfolio`

## 📸 Portfolio Management Features

### **Add Gallery**
1. Click the **"+ Add Gallery"** button
2. Fill in the form:
   - **Gallery Name**: Enter a descriptive name
   - **Description**: Add details about the event
   - **Category**: Select from dropdown (Batch Party, Social Gathering, etc.)
   - **Cover Image**: Upload a cover photo
   - **Photos**: Upload multiple event photos (drag & drop supported)
3. Click **"Add Gallery"** to save

### **Update Gallery**
1. Find the gallery you want to edit
2. Click the **"Edit"** button
3. Modify the details in the form
4. Click **"Update Gallery"** to save changes

### **Delete Gallery**
1. Find the gallery you want to delete
2. Click the **"Delete"** button
3. Confirm deletion in the popup
4. Gallery will be permanently removed

### **View Gallery**
1. Click **"View Gallery"** on any gallery card
2. Use arrow keys or navigation buttons to browse photos
3. Click **"Download"** to save individual photos

## 📊 Reports & Analytics

### **PDF Report**
- Click **"📄 PDF Report"** to generate a downloadable PDF
- Contains gallery statistics and details

### **Excel Report**
- Click **"📊 Excel Report"** to generate an Excel file
- Includes all gallery data in spreadsheet format

## 🎯 Features Overview

### **Admin Dashboard** (`/admin`)
- **Statistics**: Total galleries, photos, categories
- **Quick Actions**: Navigate to portfolio management
- **Frontend Preview**: View public pages
- **System Info**: Admin status and system details

### **Portfolio Management** (`/admin/portfolio`)
- **Add Gallery**: Upload new event galleries with photos
- **Edit Gallery**: Modify existing gallery details
- **Delete Gallery**: Remove galleries permanently
- **View Gallery**: Browse photos in lightbox
- **Download Photos**: Save individual images
- **Generate Reports**: PDF and Excel exports
- **Category Filtering**: Filter by event type
- **Statistics Cards**: Real-time gallery stats

## 🔧 Technical Details

### **File Upload**
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Drag & Drop**: Drag files directly onto upload areas
- **Multiple Files**: Select multiple photos at once
- **Cover Image**: Separate cover photo for each gallery

### **Categories**
- **Batch Party**: Graduation and batch events
- **Social Gathering**: Club meetings and social events
- **Birthday Party**: Birthday celebrations
- **Cultural Event**: Traditional and cultural events
- **Other Event**: Miscellaneous events

### **Security**
- **Admin Authentication**: Required for all admin functions
- **Session Management**: Automatic logout on page refresh
- **Input Validation**: Form validation and error handling
- **File Validation**: Image type and size validation

## 🎨 User Interface

### **Responsive Design**
- **Desktop**: Full-featured interface with all options
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Touch-friendly interface for small screens

### **Visual Feedback**
- **Loading States**: Spinners during operations
- **Success Messages**: Toast notifications for actions
- **Error Handling**: Clear error messages
- **Hover Effects**: Interactive card animations

## 🚨 Troubleshooting

### **Login Issues**
- Ensure you're using the correct credentials
- Check if the backend server is running (`http://localhost:5050`)
- Clear browser cache if needed

### **Upload Issues**
- Check file format (images only)
- Ensure files are not too large
- Verify internet connection

### **Navigation Issues**
- Use the admin dashboard for navigation
- Check browser console for errors
- Ensure all routes are properly configured

## 📱 Testing Checklist

- [ ] **Login**: Successfully login as admin
- [ ] **Add Gallery**: Create a new gallery with photos
- [ ] **Edit Gallery**: Modify an existing gallery
- [ ] **Delete Gallery**: Remove a gallery
- [ ] **View Gallery**: Browse photos in lightbox
- [ ] **Download Photos**: Save individual images
- [ ] **Generate Reports**: Create PDF and Excel reports
- [ ] **Category Filtering**: Filter galleries by category
- [ ] **Responsive Design**: Test on different screen sizes
- [ ] **Error Handling**: Test with invalid inputs

## 🔗 Quick Links

- **Admin Login**: `http://localhost:3000/signin`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Portfolio Management**: `http://localhost:3000/admin/portfolio`
- **Public Portfolio**: `http://localhost:3000/portfolio`
- **Backend API**: `http://localhost:5050`

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify both frontend and backend servers are running
3. Ensure all dependencies are installed
4. Check network connectivity

---

**Happy Admin Management! 🎉** 