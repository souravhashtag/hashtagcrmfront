import React, { useState } from 'react';
import MenuForm from './MenuCreate';
import MenuList from './MenuList';

const MenuPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);

  const handleEdit = (menu: any) => setSelectedMenu(menu);
  const clearSelection = () => setSelectedMenu(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* <h1 className="text-2xl font-bold text-center mb-6">Menu Management Portal</h1>
      <MenuForm selectedMenu={selectedMenu} onClear={clearSelection} />
      <MenuList onEdit={handleEdit} /> */}
    </div>
  );
};

export default MenuPage;
