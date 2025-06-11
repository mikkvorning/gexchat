import { Box, IconButton, TextField } from '@/app/muiImports';
import { useSidebar } from '../SidebarProvider';
import { useState } from 'react';
import AddContact from '../AddContact/AddContact';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
interface ChatSearchProps {
  onChatCreated?: (chatId: string) => void;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ onChatCreated }) => {
  const { searchValue, setSearchValue } = useSidebar();

  const [addContactOpen, setAddContactOpen] = useState(false);

  return (
    <Box display='flex' mb={2} gap={1}>
      <TextField
        label='Search contacts'
        variant='outlined'
        type='search'
        size='small'
        fullWidth
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      {/* Opens add user dialog */}
      <Box display='flex' justifyContent='flex-end'>
        <IconButton
          aria-label='Add Contact'
          onClick={() => setAddContactOpen(true)}
        >
          <PersonAddIcon />
        </IconButton>
      </Box>{' '}
      <AddContact
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onChatCreated={onChatCreated}
      />
    </Box>
  );
};

export default ChatSearch;
