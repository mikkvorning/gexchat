import { Box, TextField } from '@/app/muiImports';
import { useSidebar } from '../SidebarProvider';

const ChatSearch = () => {
  const { searchValue, setSearchValue } = useSidebar();

  return (
    <Box display='flex' alignItems='center' mb={2}>
      <TextField
        label='Search contacts'
        variant='outlined'
        type='search'
        size='small'
        fullWidth
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
    </Box>
  );
};

export default ChatSearch;
