import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { BaseUser } from '../types/types';

interface AppContextType {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filteredContacts: {
    online: BaseUser[];
    offline: BaseUser[];
  };
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

export const AppProvider = (props: Props) => {
  const [searchValue, setSearchValue] = useState('');
  const filteredContacts = filterContacts(props.contacts, searchValue);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  useEffect(() => {
    console.log(`Selected chat changed: ${selectedChat}`);
  }, [selectedChat]);

  return (
    <AppContext.Provider
      value={{
        searchValue,
        setSearchValue,
        filteredContacts,
        selectedChat,
        setSelectedChat,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
