import React, { createContext, useContext, ReactNode, useState } from 'react';
import { BaseUser } from '../../types/types';

interface SidebarContextType {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filteredContacts: {
    online: BaseUser[];
    offline: BaseUser[];
  };
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const filterContacts = (contacts: BaseUser[], searchValue: string) => {
  const filteredBySearch = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchValue.toLowerCase())
  );

  const online = filteredBySearch.filter(
    (c) => c.status === 'online' || c.status === 'away'
  );
  const offline = filteredBySearch.filter((c) => c.status === 'offline');

  return { online, offline };
};

type Props = {
  children: ReactNode;
  contacts: BaseUser[];
};

export const SidebarProvider = (props: Props) => {
  const [searchValue, setSearchValue] = useState('');
  const filteredContacts = filterContacts(props.contacts, searchValue);

  return (
    <SidebarContext.Provider
      value={{
        searchValue,
        setSearchValue,
        filteredContacts,
      }}
    >
      {props.children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
