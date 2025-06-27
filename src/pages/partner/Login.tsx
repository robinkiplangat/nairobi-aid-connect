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
        navigate('/partner/dashboard');
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
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative dark:bg-background"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), url('https://images.unsplash.com/photo-1570284613060-766c33850e79?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-foreground">
            Partner Login
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
            SOS Nairobi Partner Dashboard
          </p>
        </div>

        <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Sign in to your account</CardTitle>
            <CardDescription className="text-gray-600 dark:text-muted-foreground">
              Enter your credentials to access the partner dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50/80 dark:text-destructive dark:bg-destructive/10 p-3 rounded-md border border-red-200 dark:border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium dark:text-muted-foreground">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/80 dark:bg-background/70 border-gray-200 dark:border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium dark:text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-white/80 dark:bg-background/70 border-gray-200 dark:border-border"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-sm text-gray-600 bg-blue-50/80 dark:bg-blue-900/10 p-4 rounded-md border border-blue-200 dark:border-blue-500/20">
                <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">Demo Credentials:</p>
                <p className="text-blue-800 dark:text-blue-400">Email: admin@sos-nairobi.org</p>
                <p className="text-blue-800 dark:text-blue-400">Password: demo123</p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-blue-600 dark:text-primary hover:text-blue-500 dark:hover:text-primary/90 font-medium"
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
