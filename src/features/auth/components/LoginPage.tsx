
import React, { useState,useEffect } from 'react';
import './LoginPage.css';
import {login} from '../../../services/authService';
import { useNavigate } from 'react-router-dom';
declare global {
  interface Window {
    electronAPI?: {
      sendUserData: (data: { token: string; userId: string }) => void;
    };
  }
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Add validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();  

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  // React.useEffect(() => {
  //   if (window.electronAPI) {
  //     console.log(' electronAPI is exposed on window!');
  //   } else {
  //     console.error(' electronAPI NOT found on window!');
  //   }
  // }, []);
  // Password validation function
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailError) {
      validateEmail(newEmail);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (passwordError) {
      validatePassword(newPassword);
    }
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    // Only proceed if both are valid
    if (isEmailValid && isPasswordValid) {
      setIsSubmitting(true);
      
      try {
        const data = await login({ email, password });
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        const accessToken = data.accessToken;
        if (window.electronAPI && window.electronAPI.sendUserData) {
          window.electronAPI.sendUserData({
            token: data.accessToken,
            userId: data.accessToken,
          });
        } else {
          console.warn('electronAPI not available on window');
        }
        window.location.href='dashboard'
        console.log('Login successful', data);
      } catch (error: any) {
        console.error('Login failed', error);
        
        // Handle specific API errors
        if (error.response) {
          switch (error.response.status) {
            case 401:
              setPasswordError('Invalid email or password');
              break;
            case 429:
              setPasswordError('Too many attempts. Please try again later.');
              break;
            default:
              setPasswordError('Login failed. Please try again.');
          }
        } else {
          setPasswordError('Cannot connect to server. Please check your connection.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <div className="login-container">
      {/* Left Banner Section */}
      <div className="banner-section">
        <div className="banner-card">
          <div className="user-icon-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5"></circle>
              <path d="M20 21a8 8 0 1 0-16 0"></path>
            </svg>
          </div>
          <p className="banner-tagline">Empowering people through seamless</p>
          <h1 className="banner-title">HR Management.</h1>
          <p className="banner-description">
            Efficiently manage your workforce, streamline operations effortlessly.
          </p>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="login-section">
        <div className="login-content">
          <div className="brand-header">
          <img src="images/logo.png" alt="Logo" className="brand-logo" style={{ height: '60px' }} />

          </div>
          
          <div className="login-header">
            <h3 className="login-title">Login to your Account</h3>
            <p className="login-subtitle">See what is going on with your business</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                placeholder="johndoe@email.com"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && <div id="email-error" className="error-message">{emailError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  placeholder="••••••••••••"
                  className={`form-input ${passwordError ? 'input-error' : ''}`}
                  required
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" x2="22" y1="2" y2="22"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <div id="password-error" className="error-message">{passwordError}</div>}
            </div>

            <div className="form-footer">
              <div className="remember-container">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="remember-checkbox"
                />
                <label htmlFor="remember" className="remember-label">
                  Remember
                </label>
              </div>
              <a href="#" className="forgot-password">
                Forgot Password?
              </a>
            </div>

            <button 
              type="submit" 
              className="continue-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'LOGGING IN...' : 'CONTINUE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;