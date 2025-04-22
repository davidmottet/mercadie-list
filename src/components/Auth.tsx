import React, { useState } from 'react';
import Parse from '../parseConfig';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const user = await Parse.User.logIn(email, password);
        if (!user) {
          throw new Error('Failed to authenticate user');
        }
      } else {
        const user = new Parse.User();
        user.set("username", email);
        user.set("email", email);
        user.set("password", password);
        const result = await user.signUp();
        if (!result) {
          throw new Error('Failed to create user account');
        }
      }
      
      if (Parse.User.current()) {
        onLogin();
      } else {
        throw new Error('Authentication succeeded but user session is invalid');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-app">
      <div className="w-full max-w-md p-8 rounded-lg shadow-soft bg-element">
        <h2 className="text-2xl font-bold mb-6 text-surface-900">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="text-xl">❌</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm bg-element border-surface-200 text-surface-900 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm bg-element border-surface-200 text-surface-900 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isLogin ? (
              <>
                <span className="text-xl">🔑</span> Login
              </>
            ) : (
              <>
                <span className="text-xl">👤</span> Register
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-600 hover:underline"
          >
            {isLogin ? 'Create an account' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;