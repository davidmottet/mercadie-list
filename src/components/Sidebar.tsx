import React, { useState, useEffect } from 'react';
import Parse from '../parseConfig';
import { ShoppingList } from '../models/ShoppingList';

interface SidebarProps {
  currentList: string | null;
  setCurrentList: (list: string | null) => void;
}

interface ListItem {
  id: string;
  name: string;
  isEditing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentList, setCurrentList }) => {
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
      <div className="w-full xl:w-80 bg-gray-50 rounded-lg shadow-lg p-6 flex items-center justify-center">
        <span className="text-2xl animate-spin">🔄</span>
      </div>
    );
  }

  return (
    <div className="w-full xl:w-80 bg-gray-50 rounded-lg shadow-lg p-6">
      <div className="p-4">
        {isCreating ? (
          <form onSubmit={createNewList} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="w-full px-3 py-2 pr-24 border border-surface-200 rounded-lg bg-element text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="absolute right-0 top-0 h-full flex">
                <button
                  type="submit"
                  className="h-full px-3 bg-primary-600 hover:bg-primary-700 text-white 
                           flex items-center justify-center"
                >
                  <span className="text-xl">✅</span>
                </button>
                <button
                  type="button"
                  onClick={cancelCreatingList}
                  className="h-full px-3 bg-surface-100 hover:bg-surface-200 rounded-r-lg text-surface-800 flex items-center justify-center"
                >
                  <span className="text-xl">❌</span>
                </button>
              </div>
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
        )}
      </div>
      <nav className="mt-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`px-4 py-3 ${
              currentList === list.id
                ? 'bg-surface-100'
                : 'hover:bg-surface-50'
            }`}
          >
            {editingName.hasOwnProperty(list.id) ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingName[list.id]}
                  onChange={(e) => setEditingName({ ...editingName, [list.id]: e.target.value })}
                  className="w-[calc(100%-4rem)] px-2 py-1 border border-surface-200 rounded bg-element text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => saveListName(list.id)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <span className="text-xl">✅</span>
                  </button>
                  <button
                    onClick={() => cancelEditing(list.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <span className="text-xl">❌</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentList(list.id)}
                  className="flex-1 text-left hover:text-primary-600"
                >
                  {list.name}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(list)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <span className="text-xl">✏️</span>
                  </button>
                  <button
                    onClick={() => setDeletingList(list.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                </div>
              </div>
            )}
            {deletingList === list.id && (
              <div className="mt-2 p-2 bg-red-100 rounded">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this list?
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => deleteList(list.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeletingList(null)}
                    className="flex-1 bg-surface-200 hover:bg-surface-300 text-surface-800 px-2 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;