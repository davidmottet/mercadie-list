import React from 'react';

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout }) => {
  return (
    <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-0">
      <div className="flex items-center space-x-6">
        <nav className="hidden md:flex space-x-4">
          <a href="/" className="bg-white text-gray-800 px-2 lg:px-4 py-2 rounded-full shadow-lg hover:bg-gray-900 hover:text-gray-100 transition duration-300">
            <span className="text-xl">🏠</span>
            <span className="hidden xl:inline ml-2">Accueil</span>
          </a>
          
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-900 hover:text-gray-100 transition duration-300"
          >
            <span className="text-xl mr-2">🚪</span>Déconnexion
          </button>
        ) : (
          <>
            <a
              href="/login"
              className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-900 hover:text-gray-100 transition duration-300"
            >
              <span className="text-xl mr-2">🔑</span>Connexion
            </a>
            <a
              href="/signup"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
            >
              <span className="text-xl mr-2">✨</span>Inscription
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar; 