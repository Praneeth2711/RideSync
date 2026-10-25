import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, AlertCircle, ArrowRight } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setGeneralError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.confirmPassword
      );
      navigate('/dashboard');
    } catch (err) {
      setGeneralError(
        err.response?.data?.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-10 h-10 rounded-md bg-brand-black text-white items-center justify-center mb-3">
            <Car className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-black">
            Create your account
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            One single account works as both Rider and Driver
          </p>
        </div>

        {generalError && (
          <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="e.g. Suresh Kumar"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@domain.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-black hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
