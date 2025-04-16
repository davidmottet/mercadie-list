import React, { useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import Parse from '../parseConfig';

interface AuthProps {
  onLogin: () => void;
  isDarkMode: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, isDarkMode }) => {
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
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-app'}`}>
      <div className={`w-full max-w-md p-8 rounded-lg shadow-soft ${isDarkMode ? 'bg-gray-800' : 'bg-element'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-surface-900'}`}>
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-surface-700'}`}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-element border-surface-200 text-surface-900'
              } focus:ring-primary-500 focus:border-primary-500`}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-surface-700'}`}>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-element border-surface-200 text-surface-900'
              } focus:ring-primary-500 focus:border-primary-500`}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isLogin ? (
              <>
                <LogIn size={20} />
                <span>Se connecter</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>S'inscrire</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={`text-sm ${isDarkMode ? 'text-primary-400' : 'text-primary-600'} hover:underline`}
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;