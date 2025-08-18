import React from 'react';
import {
  Avatar,
  Badge,
  ListItem,
  ListItemText,
  Typography,
} from '../../../app/muiImports';

interface GeminiBotListItemProps {
  isSelected: boolean;
  onSelect: () => void;
}

const GeminiBotListItem: React.FC<GeminiBotListItemProps> = ({
  isSelected,
  onSelect,
}) => (
  <ListItem
    onClick={onSelect}
    sx={{
      borderRadius: 1,
      cursor: 'pointer',
      py: 1,
      mb: 1,
      backgroundColor: isSelected ? 'action.selected' : 'inherit',
      '&:hover': {
        backgroundColor: 'action.hover',
      },
      ...(isSelected && { boxShadow: 2 }),
    }}
  >
    <Badge color='secondary' variant='dot' sx={{ mr: 2 }} overlap='circular'>
      <Avatar sx={{ bgcolor: '#6C47FF' }}>G</Avatar>
    </Badge>
    <ListItemText
      primary={
        <Typography
          variant='subtitle2'
          sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}
        >
          Gemini-bot
        </Typography>
      }
      secondary={
        <Typography variant='body2' color='text.secondary'>
          Your AI assistant
        </Typography>
      }
    />
  </ListItem>
);

export default GeminiBotListItem;
