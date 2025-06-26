
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock authentication - replace with actual API call
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@sos-nairobi.org' && password === 'demo123') {
        // Success - redirect to dashboard
        navigate('/partner');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Partner Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            SOS Nairobi Partner Dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the partner dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <p className="font-medium">Demo Credentials:</p>
                <p>Email: admin@sos-nairobi.org</p>
                <p>Password: demo123</p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
