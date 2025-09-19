import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import { ChatSummary } from '../types/types';

interface AppContextType {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filterChats: (chats: ChatSummary[]) => ChatSummary[];
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pure function - easily testable and reusable
const filterChatsBySearch = (
  chats: ChatSummary[],
  searchValue: string
): ChatSummary[] => {
  if (!searchValue) return chats;

  const lowerSearchValue = searchValue.toLowerCase();

  return chats.filter((chat) => {
    // For direct chats, search by participant names
    if (chat.type === 'direct') {
      return chat.otherParticipants.some(
        (participant) =>
          participant.displayName.toLowerCase().includes(lowerSearchValue) ||
          participant.username.toLowerCase().includes(lowerSearchValue)
      );
    }

    // For group chats, search by chat name or participant names
    if (chat.type === 'group') {
      const nameMatch = chat.name?.toLowerCase().includes(lowerSearchValue);
      const participantMatch = chat.otherParticipants.some(
        (participant) =>
          participant.displayName.toLowerCase().includes(lowerSearchValue) ||
          participant.username.toLowerCase().includes(lowerSearchValue)
      );
      return nameMatch || participantMatch;
    }

    return false;
  });
};

type Props = { children: ReactNode };

export const AppProvider = (props: Props) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Memoized function - only recreates when searchValue changes
  const filterChats = useCallback(
    (chats: ChatSummary[]) => filterChatsBySearch(chats, searchValue),
    [searchValue]
  );

  return (
    <AppContext.Provider
      value={{
        searchValue,
        setSearchValue,
        filterChats,
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
