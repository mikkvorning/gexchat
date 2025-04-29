import React from 'react';
import { Box, Paper } from '../app/muiImports';

const Sidebar = () => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: 80,
        height: '100vh',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        boxShadow: 1,
      }}
    >
      <Box
        flex={1}
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='space-between'
        py={2}
      >
        {/* Top section for future nav/chat list */}
        <Box
          flex={1}
          width='100%'
          display='flex'
          flexDirection='column'
          alignItems='center'
        />
        {/* Bottom section for settings */}
      </Box>
    </Paper>
  );
};

export default Sidebar;
