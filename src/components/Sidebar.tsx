import React, { useState, useEffect } from 'react';
import { List, Plus, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';
import Parse from '../parseConfig';
import { ShoppingList } from '../models/ShoppingList';

interface SidebarProps {
  currentList: string | null;
  setCurrentList: (list: string | null) => void;
  isExpanded: boolean;
}

interface ListItem {
  id: string;
  name: string;
  isEditing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentList, setCurrentList, isExpanded }) => {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingName, setEditingName] = useState<{ [key: string]: string }>({});
  const [deletingList, setDeletingList] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (lists.length > 0 && !currentList) {
      setCurrentList(lists[0].id);
    }
  }, [lists]);

  const loadLists = async () => {
    try {
      setLoading(true);
      const currentUser = Parse.User.current();
      if (!currentUser) return;

      const query = new Parse.Query(ShoppingList);
      query.equalTo('owner', currentUser);
      const results = await query.find();
      
      const listsData = results.map(list => ({
        id: list.id || '',
        name: list.getName()
      })) as ListItem[];
      
      setLists(listsData);
      
      if (listsData.length > 0 && !currentList) {
        setCurrentList(listsData[0].id);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCreatingList = () => {
    setIsCreating(true);
    setNewListName('');
  };

  const cancelCreatingList = () => {
    setIsCreating(false);
    setNewListName('');
  };

  const createNewList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;

      const newList = new ShoppingList();
      newList.setName(newListName.trim());
      newList.setItems([]);
      newList.setOwner(currentUser as any);

      const acl = new Parse.ACL(currentUser);
      newList.setACL(acl);

      await newList.save();
      
      setIsCreating(false);
      setNewListName('');
      await loadLists();
      setCurrentList(newList.id || null);
    } catch (error) {
      console.error('Error creating new list:', error);
    }
  };

  const startEditing = (list: ListItem) => {
    setEditingName({ ...editingName, [list.id]: list.name });
  };

  const cancelEditing = (listId: string) => {
    const newEditingName = { ...editingName };
    delete newEditingName[listId];
    setEditingName(newEditingName);
  };

  const saveListName = async (listId: string) => {
    if (!editingName[listId]?.trim()) return;

    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;

      const query = new Parse.Query(ShoppingList);
      const list = await query.get(listId);

      if (list.getOwner().id !== currentUser.id) {
        throw new Error("You don't have permission to modify this list");
      }

      list.setName(editingName[listId].trim());
      await list.save();

      const newLists = lists.map(l => 
        l.id === listId ? { ...l, name: editingName[listId].trim() } : l
      );
      setLists(newLists);
      cancelEditing(listId);
    } catch (error) {
      console.error('Error updating list name:', error);
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) return;

      const query = new Parse.Query(ShoppingList);
      const list = await query.get(listId);

      if (list.getOwner().id !== currentUser.id) {
        throw new Error("You don't have permission to delete this list");
      }

      await list.destroy();

      const newLists = lists.filter(l => l.id !== listId);
      setLists(newLists);
      
      if (currentList === listId && newLists.length > 0) {
        setCurrentList(newLists[0].id);
      } else if (newLists.length === 0) {
        setCurrentList(null);
      }
      
      setDeletingList(null);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  if (loading) {
    return (
      <div className={`${isExpanded ? 'w-64' : 'w-16'} bg-element dark:bg-gray-800 border-r border-surface-200 dark:border-gray-700 flex items-center justify-center h-screen transition-all duration-300`}>
        <span className="text-2xl animate-spin">🔄</span>
      </div>
    );
  }

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-16'} bg-element dark:bg-gray-800 border-r border-surface-200 dark:border-gray-700 transition-all duration-300`}>
      <div className="p-4">
        {isExpanded ? (
          isCreating ? (
            <form onSubmit={createNewList} className="space-y-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="w-full px-3 py-2 border border-surface-200 dark:border-gray-600 rounded-lg 
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg 
                           flex items-center justify-center space-x-1"
                >
                  <span className="text-xl">✅</span>
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  onClick={cancelCreatingList}
                  className="flex-1 bg-surface-100 dark:bg-gray-600 hover:bg-surface-200 dark:hover:bg-gray-500 
                           text-surface-800 dark:text-gray-200 px-3 py-2 rounded-lg flex items-center justify-center space-x-1"
                >
                  <span className="text-xl">❌</span>
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={startCreatingList}
              className="w-full flex items-center justify-center space-x-2 btn-primary"
            >
              <span className="text-xl">➕</span>
              <span>New list</span>
            </button>
          )
        ) : (
          <button 
            onClick={startCreatingList}
            className="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-700 
                     text-white rounded-lg transition-colors mx-auto"
          >
            <span className="text-xl">➕</span>
          </button>
        )}
      </div>
      <nav className="mt-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`px-4 py-3 ${
              currentList === list.id
                ? 'bg-surface-100 dark:bg-primary-900/20'
                : 'hover:bg-surface-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {isExpanded ? (
              editingName.hasOwnProperty(list.id) ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingName[list.id]}
                    onChange={(e) => setEditingName({ ...editingName, [list.id]: e.target.value })}
                    className="w-[calc(100%-4rem)] px-2 py-1 border border-surface-200 dark:border-gray-600 rounded 
                             dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveListName(list.id)}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                    >
                      <span className="text-xl">✅</span>
                    </button>
                    <button
                      onClick={() => cancelEditing(list.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    >
                      <span className="text-xl">❌</span>
                    </button>
                  </div>
                </div>
              ) : deletingList === list.id ? (
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-sm text-red-600 dark:text-red-400">Delete the list?</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => deleteList(list.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    >
                      <span className="text-xl">✅</span>
                    </button>
                    <button
                      onClick={() => setDeletingList(null)}
                      className="p-1 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/20 rounded"
                    >
                      <span className="text-xl">❌</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentList(list.id)}
                    className="flex items-center space-x-3 flex-1 text-left"
                  >
                    <span className={`text-xl ${
                      currentList === list.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-700 dark:text-gray-300'
                    }`}>📋</span>
                    <span className={`${
                      currentList === list.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-700 dark:text-gray-300'
                    }`}>
                      {list.name}
                    </span>
                  </button>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEditing(list)}
                      className="p-1 hover:bg-surface-100 dark:hover:bg-gray-600 rounded"
                    >
                      <span className="text-lg">📝</span>
                    </button>
                    <button
                      onClick={() => setDeletingList(list.id)}
                      className="p-1 hover:bg-surface-100 dark:hover:bg-gray-600 rounded"
                    >
                      <span className="text-lg">🗑️</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <button
                onClick={() => setCurrentList(list.id)}
                className="w-8 h-8 mx-auto flex items-center justify-center"
              >
                <span className={`text-xl ${
                  currentList === list.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-700 dark:text-gray-300'
                }`}>📋</span>
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar