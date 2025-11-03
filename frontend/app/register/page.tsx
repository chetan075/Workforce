"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle, UserCheck } from 'lucide-react';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'FREELANCER' as 'FREELANCER' | 'CLIENT'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  });
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Password validation
  useEffect(() => {
    setValidations({
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /\d/.test(formData.password),
      match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
    });
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('🎯 Frontend Form - Input change:', { name, value, type: typeof value });
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('🎯 Frontend Form - Updated formData:', newData);
      return newData;
    });
    setError('');
  };

  const isFormValid = () => {
    return formData.name.trim() &&
           formData.email.trim() &&
           validations.length &&
           validations.uppercase &&
           validations.lowercase &&
           validations.number &&
           validations.match;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('🎯 Frontend Form - Submit called with formData:', formData);
    console.log('🎯 Frontend Form - Role specifically:', formData.role, 'Type:', typeof formData.role);

    if (!isFormValid()) {
      setError('Please fill in all fields and ensure password requirements are met.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🎯 Frontend Form - Calling register with:', {
        email: formData.email,
        password: '[HIDDEN]',
        name: formData.name,
        role: formData.role
      });
      
      const userData = await register(formData.email, formData.password, formData.name, formData.role);
      if (userData) {
        router.push('/dashboard');
      } else {
        setError('Registration failed. This email might already be in use.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Workverse</h1>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-gray-400">Join the future of freelance work</p>
        </div>

        {/* Register Form */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                I want to
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="FREELANCER">Work as a freelancer</option>
                  <option value="CLIENT">Hire freelancers</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-300 mb-3">Password requirements:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 ${validations.length ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className={`h-3 w-3 ${validations.length ? 'text-green-400' : 'text-gray-500'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validations.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className={`h-3 w-3 ${validations.uppercase ? 'text-green-400' : 'text-gray-500'}`} />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validations.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className={`h-3 w-3 ${validations.lowercase ? 'text-green-400' : 'text-gray-500'}`} />
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validations.number ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className={`h-3 w-3 ${validations.number ? 'text-green-400' : 'text-gray-500'}`} />
                    <span>Number</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    validations.match || !formData.confirmPassword 
                      ? 'border-gray-600 focus:ring-blue-500 focus:border-transparent' 
                      : 'border-red-500 focus:ring-red-500'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && !validations.match && (
                <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700 mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Join thousands of professionals using Workverse</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Secure platform</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Global network</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}