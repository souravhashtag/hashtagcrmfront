import React, { createContext, useState, useContext, ReactNode } from 'react';
export interface MenuItem {
  name: string;
  slug: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  position: string;
  role: {
    menulist: MenuItem[];
    [key: string]: any; 
  };
  menulist?: MenuItem[]; 
  profilePicture: string;
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;