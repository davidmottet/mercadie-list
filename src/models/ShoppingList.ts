import Parse from '../parseConfig';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

export const CATEGORIES = {
  FRUITS_LEGUMES: 'Fruits et Légumes',
  VIANDES: 'Viandes et Poissons',
  EPICERIE: 'Épicerie',
  BOISSONS: 'Boissons',
  PRODUITS_LAITIERS: 'Produits Laitiers',
  SURGELES: 'Surgelés',
  HYGIENE: 'Hygiène',
  AUTRES: 'Autres'
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

export interface ShoppingListData {
  id: string;
  name: string;
  items: ShoppingItem[];
}

export class ShoppingList extends Parse.Object {
  constructor() {
    super('ShoppingList');
  }

  getName(): string {
    return this.get('name');
  }

  setName(name: string) {
    this.set('name', name);
  }

  getItems(): ShoppingItem[] {
    return this.get('items') || [];
  }

  setItems(items: ShoppingItem[]) {
    this.set('items', items);
  }

  getOwner(): Parse.User {
    return this.get('owner');
  }

  setOwner(owner: Parse.User) {
    this.set('owner', owner);
  }
}

Parse.Object.registerSubclass('ShoppingList', ShoppingList);