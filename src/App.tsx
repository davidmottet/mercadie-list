import React, { useState, useEffect } from 'react';
import { Moon, Sun, Plus, List, History, Share2, LogOut, Menu } from 'lucide-react';
import ShoppingList from './components/ShoppingList';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Parse from './parseConfig';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentList, setCurrentList] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    const currentUser = Parse.User.current();
    setIsAuthenticated(!!currentUser);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await Parse.User.logOut();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-app'}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          currentList={currentList} 
          setCurrentList={setCurrentList} 
          isExpanded={isSidebarExpanded}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-surface-200 bg-element'}`}>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-surface-100 text-surface-600'
                }`}
              >
                <Menu size={20} />
              </button>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-surface-900'}`}>
                Liste Parfaite
              </h1>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-surface-600'}`}>
                L'essentiel, simplement
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-surface-100 text-surface-600'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-surface-100 text-surface-600'
                }`}
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <ShoppingList isDarkMode={isDarkMode} currentList={currentList} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;