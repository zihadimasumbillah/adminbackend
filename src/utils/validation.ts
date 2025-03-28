import * as EmailValidator from 'email-validator';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  code?: string;
}

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { 
      isValid: false, 
      message: 'Password is required',
      code: 'PASSWORD_REQUIRED'
    };
  }

  if (password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long',
      code: 'PASSWORD_TOO_SHORT'
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter',
      code: 'PASSWORD_NO_UPPERCASE'
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter',
      code: 'PASSWORD_NO_LOWERCASE'
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one number',
      code: 'PASSWORD_NO_NUMBER'
    };
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character (!@#$%^&*)',
      code: 'PASSWORD_NO_SPECIAL'
    };
  }
  
  return { 
    isValid: true, 
    message: 'Password is valid'
  };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required',
      code: 'EMAIL_REQUIRED'
    };
  }

  if (!EmailValidator.validate(email)) {
    return {
      isValid: false,
      message: 'Invalid email format',
      code: 'EMAIL_INVALID_FORMAT'
    };
  }

  return {
    isValid: true,
    message: 'Email is valid'
  };
};

export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return {
      isValid: false,
      message: 'Name is required',
      code: 'NAME_REQUIRED'
    };
  }

  if (name.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long',
      code: 'NAME_TOO_SHORT'
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      message: 'Name cannot be longer than 50 characters',
      code: 'NAME_TOO_LONG'
    };
  }

  if (!/^[a-zA-Z0-9\s-_.]+$/.test(name)) {
    return {
      isValid: false,
      message: 'Name can only contain letters, numbers, spaces, and basic punctuation',
      code: 'NAME_INVALID_CHARS'
    };
  }

  return {
    isValid: true,
    message: 'Name is valid'
  };
};