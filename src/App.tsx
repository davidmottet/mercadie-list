import { useState, useEffect } from 'react';
import ShoppingList from './components/ShoppingList';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Parse from './parseConfig';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentList, setCurrentList] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      <div className="container mx-auto px-4 md:px-0">
        <div className="flex flex-col xl:flex-row gap-6 py-6">
          {/* Sidebar */}
          <Sidebar 
            currentList={currentList} 
            setCurrentList={setCurrentList} 
          />
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <header className={`p-4 flex items-center justify-between border-b rounded-t-lg ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-surface-200 bg-element'
            }`}>
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-surface-900'}`}>
                  Perfect List
                </h1>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-surface-600'}`}>
                  The essentials, simply
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
                  <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-full ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-surface-100 text-surface-600'
                  }`}
                >
                  <span className="text-xl">🚪</span>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="overflow-auto p-6">
              <ShoppingList isDarkMode={isDarkMode} currentList={currentList} />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;