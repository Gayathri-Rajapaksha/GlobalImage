import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Booking.css';

const locations = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Anuradhapura', 'Other'];

const SmartStepper = ({ step, totalSteps }) => (
  <div className="smart-stepper">
    <div className="smart-stepper-progress">
      <div 
        className="smart-stepper-progress-bar" 
        style={{ width: `${(step / totalSteps) * 100}%` }}
      ></div>
    </div>
    <div className="smart-stepper-steps">
      {['Service Details', 'Event Information', 'Payment', 'Confirmation'].map((label, idx) => (
        <div key={label} className={`smart-stepper-step ${step > idx + 1 ? 'completed' : step === idx + 1 ? 'active' : ''}`}>
          <div className="smart-stepper-circle">
            {step > idx + 1 ? '✓' : idx + 1}
          </div>
          <span className="smart-stepper-label">{label}</span>
        </div>
    ))}
    </div>
  </div>
);

// Credit Card Component with real card detection


const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isUser, setIsUser] = useState(localStorage.getItem('isUser') === 'true');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentResult, setPaymentResult] = useState(null);
  const [showServiceMessage, setShowServiceMessage] = useState(false);
  const [form, setForm] = useState({
    // Service Details
    selectedService: null,
    eventType: '',
    
    // Event Information
    fullName: '',
    contactNumber: '',
    email: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
    specialRequirements: '',
    

    
    // Confirmation
    otp: ''
  });
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const userSignedIn = localStorage.getItem('isUser') === 'true';
      setIsUser(userSignedIn);
      
      if (!userSignedIn) {
        navigate('/signin', { 
          state: { 
            redirectTo: '/booking',
            selectedService: location.state?.selectedService,
            eventType: location.state?.eventType
          } 
        });
        return;
      }
    };

    checkAuth();
    
    const handleLogin = () => {
      setIsUser(true);
    };
    
    window.addEventListener('login', handleLogin);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('storage', checkAuth);
    };
  }, [navigate, location.state]);

  // Handle service data from navigation state
  useEffect(() => {
    if (location.state) {
      if (location.state.eventType) {
      setForm(f => ({ ...f, eventType: location.state.eventType }));
      }
      if (location.state.selectedService) {
        setForm(f => ({ 
          ...f, 
          selectedService: location.state.selectedService,
          eventType: location.state.selectedService.category 
        }));
        calculatePrice(location.state.selectedService);
      }
    } else {
      // If no service selected, show message to go to services first
      if (isUser) {
        setShowServiceMessage(true);
        setTimeout(() => {
          navigate('/services');
        }, 3000);
        return;
      }
    }
  }, [location.state, isUser, navigate]);

  // Calculate estimated price based on service and requirements
  const calculatePrice = (service) => {
    if (!service) return;
    
    let basePrice = service.price || 0;
    let totalPrice = basePrice;
    
    setEstimatedPrice(totalPrice);
    
    // Calculate advance payment (10% of total)
    const advance = Math.round(totalPrice * 0.1);
    const remaining = totalPrice - advance;
    
    setAdvanceAmount(advance);
    setRemainingAmount(remaining);
  };

  // Handle payment slip upload
  const handlePaymentSlipUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file (JPEG, PNG, GIF, or PDF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setPaymentSlip(file);
    }
  };

  // Real-time validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      
      case 'contactNumber':
        if (!value) {
          newErrors.contactNumber = 'Contact number is required';
        } else if (!/^[0-9]{10}$/.test(value)) {
          newErrors.contactNumber = 'Please enter exactly 10 digits';
        } else {
          delete newErrors.contactNumber;
        }
        break;
      
      case 'fullName':
        if (!value) {
          newErrors.fullName = 'Full name is required';
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s.'-]+$/.test(value)) {
          newErrors.fullName = 'Name can only contain letters, spaces, dots, apostrophes, and hyphens';
        } else if (value.trim().split(' ').length < 2) {
          newErrors.fullName = 'Please enter your full name (first and last name)';
        } else {
          delete newErrors.fullName;
        }
        break;
      
      case 'date':
        if (!value) {
          newErrors.date = 'Date is required';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate < today) {
            newErrors.date = 'Date cannot be in the past';
          } else {
            delete newErrors.date;
          }
        }
        break;
      
      case 'paymentSlip':
        if (!value) {
          newErrors.paymentSlip = 'Payment slip is required';
        } else {
          delete newErrors.paymentSlip;
        }
        break;
      
      default:
        if (!value) {
          newErrors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        } else {
          delete newErrors[name];
        }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Luhn algorithm for card validation


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Restrict phone number input to only numbers
    if (name === 'contactNumber') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setForm(prev => ({ ...prev, [name]: numbersOnly }));
      validateField(name, numbersOnly);
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Auto-calculate end time when start time is selected
    if (name === 'startTime' && value && form.selectedService?.hours) {
      const startTime = new Date(`2000-01-01T${value}`);
      const endTime = new Date(startTime.getTime() + (form.selectedService.hours * 60 * 60 * 1000));
      
      // Format end time as HH:MM
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      setForm(prev => ({ ...prev, endTime: endTimeString }));
    }
    
    // Real-time validation
    validateField(name, value);
  };



  const canProceed = (currentStep) => {
    switch (currentStep) {
      case 1:
        return form.selectedService;
      case 2:
        return form.fullName && form.contactNumber && form.email && form.date && 
               form.startTime && form.endTime && form.location && form.venue && 
               Object.keys(errors).length === 0;
      case 3:
        return paymentSlip && Object.keys(errors).length === 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const processPayment = async () => {
    setUploadingSlip(true);
    setUploadProgress(0);
    
    try {
      console.log('Starting payment slip upload...');
      console.log('Payment slip file:', paymentSlip);
      
      if (!paymentSlip) {
        throw new Error('No payment slip file selected');
      }
      
      // Step 1: Upload payment slip
      const formData = new FormData();
      formData.append('paymentSlip', paymentSlip);
      
      console.log('FormData created, sending to server...');
      console.log('File size:', paymentSlip.size, 'bytes');
      console.log('File type:', paymentSlip.type);
      console.log('File name:', paymentSlip.name);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const uploadResponse = await fetch('http://localhost:5050/api/bookings/upload-slip', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response headers:', uploadResponse.headers);
      
      if (!uploadResponse.ok) {
        let errorText;
        try {
          errorText = await uploadResponse.text();
        } catch (e) {
          errorText = 'Failed to read error response';
        }
        console.error('Upload failed:', errorText);
        console.error('Response status:', uploadResponse.status);
        console.error('Response headers:', uploadResponse.headers);
        throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
      }

      let uploadResult;
      try {
        uploadResult = await uploadResponse.json();
      } catch (e) {
        console.error('Failed to parse upload response as JSON:', e);
        throw new Error('Invalid response from server - expected JSON');
      }
      
      console.log('Upload result:', uploadResult);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed on server');
      }
      
      // Step 2: Save booking to backend
      const bookingData = {
        selectedService: form.selectedService._id,
        eventType: form.eventType,
        fullName: form.fullName,
        contactNumber: form.contactNumber,
        email: form.email,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        venue: form.venue,
        specialRequirements: form.specialRequirements,
        totalAmount: estimatedPrice,
        advanceAmount: advanceAmount,
        remainingAmount: remainingAmount,
        advancePaymentId: 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentSlipFile: uploadResult.fileName
      };

      console.log('Creating booking with data:', bookingData);

      const response = await fetch('http://localhost:5050/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Booking creation failed:', errorText);
        throw new Error(`Failed to create booking: ${errorText}`);
      }

      const result = await response.json();
      console.log('Booking created successfully:', result);
      
      setPaymentResult({
        success: true,
        bookingId: result.booking.bookingId,
        bookingObjectId: result.booking._id,
        paymentId: result.booking.advancePaymentId,
        amount: advanceAmount,
        timestamp: new Date().toISOString(),
        slipFile: uploadResult.fileName
      });
      
    setPaymentStatus('success');
    setStep(4);
    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out. Please try again with a smaller file or check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      alert(`Payment slip upload failed: ${errorMessage}`);
      setPaymentResult({
        success: false,
        error: `Payment slip upload failed: ${errorMessage}`
      });
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (canProceed(step)) {
      await processPayment();
    }
  };

  // Don't render if user is not signed in
  if (!isUser) {
    return null;
  }

  // Show service selection message if no service is selected
  if (showServiceMessage) {
    return (
      <div className="smart-booking-bg">
        <div className="smart-booking-container">
          <div className="service-selection-message">
            <div className="message-icon">📋</div>
            <h2>Package Selection Required</h2>
            <p>You need to select a photography package first before proceeding with your booking.</p>
            <p>Please visit our services page to choose from our available packages.</p>
            <p>You will be redirected to the services page in a few seconds...</p>
            <div className="message-actions">
              <button 
                className="message-btn primary"
                onClick={() => navigate('/services')}
              >
                View Packages Now
              </button>
              <button 
                className="message-btn secondary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-booking-bg">
      <div className="smart-booking-container">
        <SmartStepper step={step} totalSteps={4} />
        
        <div className="smart-booking-content">
          {/* Step 1: Service Details */}
        {step === 1 && (
            <div className="smart-booking-step">
              <h2 className="smart-booking-title">Service Details</h2>
              
              {form.selectedService && (
                <div className="smart-service-card">
                  <div className="smart-service-header">
                    <h3>{form.selectedService.title}</h3>
                    <span className="smart-service-category">{form.selectedService.category}</span>
                  </div>
                  <div className="smart-service-price">
                    Base Price: LKR {form.selectedService.price?.toLocaleString() || '0'}
                  </div>
            </div>
              )}
              
              {estimatedPrice > 0 && (
                <div className="smart-price-estimate">
                  <h4>Estimated Total: LKR {estimatedPrice.toLocaleString()}</h4>
                  <p>Final price will be confirmed after event details</p>
              </div>
              )}
            </div>
          )}

          {/* Step 2: Event Information */}
          {step === 2 && (
            <div className="smart-booking-step">
              <h2 className="smart-booking-title">Event Information</h2>
              
              <div className="smart-form-grid">
                <div className="smart-form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={form.fullName} 
                    onChange={handleInputChange}
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>Contact Number</label>
                  <input 
                    type="tel" 
                    name="contactNumber" 
                    value={form.contactNumber} 
                    onChange={handleInputChange}
                    className={errors.contactNumber ? 'error' : ''}
                  />
                  {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>Event Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={form.date} 
                    onChange={handleInputChange}
                    className={errors.date ? 'error' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>Start Time</label>
                  <input 
                    type="time" 
                    name="startTime" 
                    value={form.startTime} 
                    onChange={handleInputChange}
                    className={errors.startTime ? 'error' : ''}
                  />
                  {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>End Time <span className="auto-calculated-note">(Auto-calculated)</span></label>
                  <input 
                    type="time" 
                    name="endTime" 
                    value={form.endTime} 
                    onChange={handleInputChange}
                    className={errors.endTime ? 'error' : ''}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                  {errors.endTime && <span className="error-message">{errors.endTime}</span>}
                  {form.selectedService?.hours && (
                    <div className="auto-calculation-info">
                      <span className="info-icon">ℹ️</span>
                      <span>End time automatically calculated based on {form.selectedService.hours} hours from start time</span>
                    </div>
                  )}
                </div>
                
                <div className="smart-form-group">
                  <label>Location</label>
                  <select 
                    name="location" 
                    value={form.location} 
                    onChange={handleInputChange}
                    className={errors.location ? 'error' : ''}
                  >
                    <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
                  {errors.location && <span className="error-message">{errors.location}</span>}
                </div>
                
                <div className="smart-form-group">
                  <label>Venue</label>
                  <input 
                    type="text" 
                    name="venue" 
                    value={form.venue} 
                    onChange={handleInputChange}
                    className={errors.venue ? 'error' : ''}
                  />
                  {errors.venue && <span className="error-message">{errors.venue}</span>}
            </div>
              </div>
              
              <div className="smart-form-group">
                <label>Special Requirements</label>
                <textarea 
                  name="specialRequirements" 
                  value={form.specialRequirements} 
                  onChange={handleInputChange}
                  placeholder="Any special requirements or notes..."
                  rows="4"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment Slip Upload */}
          {step === 3 && (
            <div className="smart-booking-step">
              <h2 className="smart-booking-title">Payment Slip Upload</h2>
              
              <div className="smart-payment-summary">
                <h4>Booking Summary</h4>
                <div className="smart-summary-item">
                  <span>Service:</span>
                  <span>{form.selectedService?.title}</span>
                </div>
                <div className="smart-summary-item">
                  <span>Event:</span>
                  <span>{form.eventType}</span>
                </div>
                <div className="smart-summary-item">
                  <span>Date:</span>
                  <span>{form.date}</span>
                </div>
                <div className="smart-summary-item">
                  <span>Total Amount:</span>
                  <span className="smart-total-price">LKR {estimatedPrice.toLocaleString()}</span>
            </div>
                <div className="smart-summary-item advance-payment">
                  <span>Advance Payment (10%):</span>
                  <span className="smart-advance-price">LKR {advanceAmount.toLocaleString()}</span>
            </div>
                <div className="smart-summary-item remaining-payment">
                  <span>Remaining Amount:</span>
                  <span className="smart-remaining-price">LKR {remainingAmount.toLocaleString()}</span>
            </div>
              </div>

              <div className="smart-account-details">
                <h4>Bank Account Details</h4>
                <div className="account-info">
                  <div className="account-item">
                    <span>Bank Name:</span>
                    <span>Commercial Bank of Ceylon</span>
                  </div>
                  <div className="account-item">
                    <span>Account Name:</span>
                    <span>Global Image Photography</span>
                  </div>
                  <div className="account-item">
                    <span>Account Number:</span>
                    <span>1234567890</span>
                  </div>
                  <div className="account-item">
                    <span>Branch:</span>
                    <span>Colombo Main Branch</span>
                  </div>
                  <div className="account-item">
                    <span>Swift Code:</span>
                    <span>CBCLLKLX</span>
                  </div>
                </div>
                <div className="payment-note">
                  <p><strong>Note:</strong> Please pay the advance amount (10%) to confirm your booking. Upload the payment slip after making the payment.</p>
                </div>
              </div>
              
              <div className="smart-payment-upload">
                <h4>Upload Payment Slip</h4>
                <div className="upload-section">
                  <div className="upload-area">
                    <input 
                      type="file" 
                      id="paymentSlip" 
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handlePaymentSlipUpload}
                      className="file-input"
                    />
                    <label htmlFor="paymentSlip" className="upload-label">
                      {paymentSlip ? (
                        <div className="file-selected">
                          <div className="file-icon">📄</div>
                          <div className="file-info">
                            <div className="file-name">{paymentSlip.name}</div>
                            <div className="file-size">{(paymentSlip.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">📤</div>
                          <div className="upload-text">
                            <p>Click to upload payment slip</p>
                            <p className="upload-hint">Accepted: JPG, PNG, GIF, PDF (Max 5MB)</p>
              </div>
            </div>
                      )}
                    </label>
                  </div>
                  {errors.paymentSlip && <span className="error-message">{errors.paymentSlip}</span>}
                </div>
              </div>
              
              {uploadingSlip && (
                <div className="smart-payment-processing">
                  <div className="processing-spinner"></div>
                  <p>Uploading payment slip...</p>
                  <p className="upload-info">Please wait, this may take a few moments for larger files.</p>
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="upload-status">Processing file...</p>
                </div>
              )}
            </div>
        )}

          {/* Step 4: Confirmation */}
        {step === 4 && (
            <div className="smart-booking-step">
              <h2 className="smart-booking-title">Booking Confirmation</h2>
              
              <div className="smart-confirmation-card">
                <div className="smart-confirmation-icon">✓</div>
                <h3>Advance Payment Successful!</h3>
                <p>Your advance payment has been processed. Your booking is now pending admin approval.</p>
                
                <div className="smart-booking-details">
                  <h4>Booking Details</h4>
                  <div className="smart-detail-item">
                    <span>Booking ID:</span>
                    <span>{paymentResult?.bookingId}</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Payment ID:</span>
                    <span>{paymentResult?.paymentId}</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Service:</span>
                    <span>{form.selectedService?.title}</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Event Date:</span>
                    <span>{form.date}</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Amount Paid:</span>
                    <span>LKR {paymentResult?.amount?.toLocaleString()}</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Payment Method:</span>
                    <span>Bank Transfer</span>
                  </div>
                  <div className="smart-detail-item">
                    <span>Payment Date:</span>
                    <span>{new Date(paymentResult?.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="smart-confirmation-message">
                  <p><strong>What's Next?</strong></p>
                  <ul>
                    <li>You'll receive a confirmation email shortly</li>
                    <li>Our team will contact you within 24 hours</li>
                    <li>We'll discuss final details and requirements</li>
                    <li>Your photographer will be assigned based on availability</li>
                  </ul>
                </div>

                <div className="smart-invoice-section">
                  <h4>📄 Download Invoice</h4>
                  <p>Download your booking invoice for your records</p>
                  <button 
                    className="smart-invoice-btn"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `http://localhost:5050/api/invoice/${paymentResult?.bookingObjectId}`;
                      link.download = `invoice-${paymentResult?.bookingId}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    📥 Download Invoice PDF
                  </button>
                </div>
            </div>
            </div>
          )}
          </div>
        
        {/* Navigation Buttons */}
        <div className="smart-booking-navigation">
          {step > 1 && (
            <button 
              className="smart-nav-btn smart-nav-back" 
              onClick={handleBack}
              disabled={uploadingSlip}
            >
              ← Back
            </button>
          )}
          
          {step < 4 && (
            <button 
              className={`smart-nav-btn smart-nav-next ${!canProceed(step) ? 'disabled' : ''}`}
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={!canProceed(step) || uploadingSlip}
            >
              {uploadingSlip ? 'Uploading...' : step === 3 ? 'Upload Payment Slip' : 'Next'}
            </button>
          )}
          
          {step === 4 && (
            <button 
              className="smart-nav-btn smart-nav-home" 
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking; 
