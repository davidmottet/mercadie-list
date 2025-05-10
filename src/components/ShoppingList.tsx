import React, { useState, useEffect, useCallback } from 'react';
import Parse from '../parseConfig';
import { ShoppingList as ShoppingListModel, ShoppingItem, CATEGORIES, Category } from '../models/ShoppingList';
import debounce from 'lodash/debounce';

interface ShoppingListProps {
  currentList: string | null;
}

interface GroupedItems {
  [key: string]: ShoppingItem[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ currentList }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentListObj, setCurrentListObj] = useState<ShoppingListModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.values(CATEGORIES)));
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES.AUTRES);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [ingredientsCache, setIngredientsCache] = useState<Map<string, string[]>>(new Map());
  const [isExpanded, setIsExpanded] = useState(false);

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
      setError('Error loading the list');
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
      setError('Error saving the list');
      setItems(currentListObj.getItems() || []);
    }
  };

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      // Check if user is logged in
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('User not logged in');
        return;
      }

      // Check cache first
      const cachedSuggestions = ingredientsCache.get(query.toLowerCase());
      if (cachedSuggestions) {
        setSuggestions(cachedSuggestions);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const Ingredient = Parse.Object.extend('Ingredient');
        const queryObj = new Parse.Query(Ingredient);
        
        // Create an OR query for the three fields
        const nameQuery = new Parse.Query(Ingredient);
        nameQuery.startsWith('name', query.toLowerCase());
        
        const pluralQuery = new Parse.Query(Ingredient);
        pluralQuery.startsWith('plural', query.toLowerCase());
        
        const displayPluralQuery = new Parse.Query(Ingredient);
        displayPluralQuery.startsWith('displayPlural', query.toLowerCase());
        
        queryObj._orQuery([nameQuery, pluralQuery, displayPluralQuery]);
        queryObj.limit(5); // Limit to 5 suggestions
        queryObj.select('name'); // Only select the name field
        
        const results = await queryObj.find();
        
        const newSuggestions = results.map(ingredient => ingredient.get('name'));
        setSuggestions(newSuggestions);
        
        // Update cache
        setIngredientsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(query.toLowerCase(), newSuggestions);
          return newCache;
        });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        if (error instanceof Parse.Error) {
          if (error.code === 119) { // Parse.Error.INVALID_SESSION_TOKEN
            // Handle session token error (user needs to log in again)
            setError('Your session has expired. Please log in again.');
          } else if (error.code === 209) { // Parse.Error.INVALID_ACL
            setError('You do not have the necessary permissions.');
          } else {
            setError('Error searching for ingredients.');
          }
        } else {
          setError('Error searching for ingredients.');
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300), // 300ms debounce
    [ingredientsCache]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewItem(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewItem(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
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
      setError('Error deleting the item');
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
        <span className="text-2xl animate-spin">🔄</span>
      </div>
    );
  }

  if (!currentListObj) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-surface-600">
          <p>Select a list or create a new one</p>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(items);

  return (
    <div className="mx-auto text-surface-900">
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
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Add an item..."
              className={`w-full px-6 py-3 bg-white rounded-full shadow-lg border-0 focus:ring-2 focus:ring-primary-500 ${
                'text-surface-900 placeholder-surface-500'
              }`}
            />
            <button 
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
            >
              🔍
            </button>
            
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div className={`absolute z-99 w-full mt-1 rounded-lg shadow-lg ${
                'bg-element'
              }`}>
                {isLoadingSuggestions ? (
                  <div className="p-2 flex justify-center">
                    <span className="text-xl animate-spin">🔄</span>
                  </div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-4 py-2 hover:bg-surface-100 ${
                        'text-surface-900'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            className={`w-40 px-3 py-2 rounded-lg border ${
              'bg-element border-surface-200 text-surface-900'
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
            className="btn-secondary flex items-center space-x-2"
          >
            <span className="text-xl">➕</span>
            <span>Add</span>
          </button>
        </form>
      </div>

      <div className="flex-1 bg-gray-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🛒</span>
          Shopping List
        </h2>
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500 mb-2">Your cart is empty!</p>
            <p className="text-sm text-gray-400">Time to fill it up with goodies! 🍎🥕🥛</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between px-4 ${
                  'bg-white'
                } rounded-lg mb-2`}
              >
                <span className="font-medium">{category} ({categoryItems.length})</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="p-2 rounded-full hover:bg-surface-100 cursor-pointer"
                >
                  <span className="text-xl">{expandedCategories.has(category) ? '⬇️' : '➡️'}</span>
                </div>
              </button>
              
              {expandedCategories.has(category) && (
                <div className="mb-6">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center px-4 py-1 hover:bg-surface-50 rounded-lg"
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
                        className="p-2 rounded-full hover:bg-surface-100"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div className="mt-8 flex justify-center">
          <button
            disabled
            className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2 px-8 py-4 text-lg"
          >
            <span className="text-2xl">🛍️</span>
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;