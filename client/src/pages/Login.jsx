import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, AlertCircle, ArrowRight } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
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
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setGeneralError(
        err.response?.data?.message || 'Invalid email or password.'
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
            Welcome back
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Sign in to access your rides and bookings
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
            placeholder="Your account password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-black hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
