import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import Parse from '../parseConfig';
import { ShoppingList as ShoppingListModel, ShoppingItem, CATEGORIES, Category } from '../models/ShoppingList';

interface ShoppingListProps {
  isDarkMode: boolean;
  currentList: string | null;
}

interface GroupedItems {
  [key: string]: ShoppingItem[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ isDarkMode, currentList }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentListObj, setCurrentListObj] = useState<ShoppingListModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.values(CATEGORIES)));
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES.AUTRES);

  useEffect(() => {
    if (currentList) {
      loadList();
    } else {
      setLoading(false);
      setItems([]);
      setCurrentListObj(null);
    }
  }, [currentList]);

  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new Parse.Query(ShoppingListModel);
      query.equalTo('objectId', currentList);
      query.equalTo('owner', Parse.User.current());
      const list = await query.first();
      
      if (list) {
        setCurrentListObj(list);
        const savedItems = list.getItems() || [];
        const itemsWithIds = savedItems.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID()
        }));
        setItems(itemsWithIds);
      }
    } catch (error) {
      console.error('Error loading list:', error);
      setError('Erreur lors du chargement de la liste');
    } finally {
      setLoading(false);
    }
  };

  const saveList = async (newItems: ShoppingItem[]) => {
    if (!currentListObj) return;
    try {
      setError(null);
      currentListObj.setItems(newItems);
      await currentListObj.save();
      setItems(newItems);
    } catch (error) {
      console.error('Error saving list:', error);
      setError('Erreur lors de la sauvegarde de la liste');
      setItems(currentListObj.getItems() || []);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !currentListObj) return;

    const newItems = [
      ...items,
      {
        id: crypto.randomUUID(),
        name: newItem.trim(),
        category: selectedCategory,
        checked: false,
      },
    ];
    
    setNewItem('');
    await saveList(newItems);
  };

  const toggleItem = async (id: string) => {
    if (!currentListObj) return;
    const newItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await saveList(newItems);
  };

  const deleteItem = async (itemId: string) => {
    if (!currentListObj) return;
    try {
      const newItems = items.filter(item => item.id !== itemId);
      await saveList(newItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Erreur lors de la suppression de l\'article');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const groupItemsByCategory = (items: ShoppingItem[]): GroupedItems => {
    return items.reduce((acc, item) => {
      const category = item.category || CATEGORIES.AUTRES;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as GroupedItems);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!currentListObj) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-surface-600'}`}>
          <p>Sélectionnez une liste ou créez-en une nouvelle</p>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(items);

  return (
    <div className={`max-w-3xl mx-auto ${isDarkMode ? 'text-white' : 'text-surface-900'}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <form onSubmit={addItem} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Ajouter un article..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-element border-surface-200 text-surface-900 placeholder-surface-500'
              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
            <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-surface-400'}`} />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            className={`w-40 px-3 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-element border-surface-200 text-surface-900'
            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
          >
            {Object.values(CATEGORIES).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className={`rounded-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-element'
          } shadow-soft`}>
            <button
              onClick={() => toggleCategory(category)}
              className={`w-full flex items-center justify-between p-3 ${
                isDarkMode ? 'bg-gray-700' : 'bg-surface-50'
              }`}
            >
              <span className="font-medium">{category} ({categoryItems.length})</span>
              {expandedCategories.has(category) ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
            
            {expandedCategories.has(category) && (
              <div className="divide-y divide-surface-200 dark:divide-gray-700">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center px-4 py-2 hover:bg-surface-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`flex-1 ml-3 ${item.checked ? 'line-through text-surface-500' : ''}`}>
                      {item.name}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="ml-2 text-surface-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingList;