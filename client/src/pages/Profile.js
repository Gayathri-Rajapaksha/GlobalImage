import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(() => {
    const storedUserData = localStorage.getItem('userData');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
              return {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          role: isAdmin ? 'Administrator' : 'User',
          avatar: null
        };
      } else {
        return {
          firstName: '',
          lastName: '',
          email: '',
          role: isAdmin ? 'Administrator' : 'User',
          avatar: null
        };
      }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.dispatchEvent(new Event('login'));
    navigate('/');
  };

  const handleSave = () => {
    setUser(editedUser);
    
    // Update localStorage with new user data
    const updatedUserData = {
      firstName: editedUser.firstName,
      lastName: editedUser.lastName,
      email: editedUser.email,
      isAdmin: localStorage.getItem('isAdmin') === 'true'
    };
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFullName = () => {
    return `${user.firstName} ${user.lastName}`.trim() || 'User';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedUser(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-content">
          <div className="profile-avatar-section">
            <div className="avatar-container">
                             {editedUser.avatar ? (
                 <img src={editedUser.avatar} alt="Profile" className="avatar-image" />
               ) : (
                 <div className="avatar-placeholder">
                   <span>{getFullName().charAt(0).toUpperCase()}</span>
                 </div>
               )}
              {isEditing && (
                <label className="avatar-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <span>Change Photo</span>
                </label>
              )}
            </div>
          </div>

          <div className="profile-details">
                         <div className="profile-section">
               <h3>Personal Information</h3>
               
               <div className="form-group">
                 <label>First Name</label>
                 {isEditing ? (
                   <input
                     type="text"
                     name="firstName"
                     value={editedUser.firstName}
                     onChange={handleInputChange}
                     className="profile-input"
                   />
                 ) : (
                   <p className="profile-value">{user.firstName}</p>
                 )}
               </div>

               <div className="form-group">
                 <label>Last Name</label>
                 {isEditing ? (
                   <input
                     type="text"
                     name="lastName"
                     value={editedUser.lastName}
                     onChange={handleInputChange}
                     className="profile-input"
                   />
                 ) : (
                   <p className="profile-value">{user.lastName}</p>
                 )}
               </div>

              <div className="form-group">
                <label>Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <p className="profile-value">{user.email}</p>
                )}
              </div>



                             <div className="form-group">
                 <label>Role</label>
                 <p className="profile-value role-badge">{user.role}</p>
               </div>
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <div className="action-buttons">
                  <button onClick={handleSave} className="btn-save">
                    Save Changes
                  </button>
                  <button onClick={handleCancel} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="action-buttons">
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    Edit Profile
                  </button>
                  <button onClick={handleLogout} className="btn-logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 