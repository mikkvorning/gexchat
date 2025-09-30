import React from 'react';
import {
  Avatar,
  Badge,
  ListItem,
  ListItemText,
  Typography,
} from '../../../../app/muiImports';
import { GEMINI_BOT_CONFIG } from './geminiBotConfig';
import { generateAvatarColor } from '@/utils/colors';
import { filterGeminiBotBySearch } from './geminiBotUtils';
import { useAppContext } from '@/components/AppProvider';

interface GeminiBotListItemProps {
  onChatSelect: (chatId: string) => void;
  searchValue?: string;
}

const GeminiBot: React.FC<GeminiBotListItemProps> = ({
  onChatSelect,
  searchValue = '',
}) => {
  const { selectedChat } = useAppContext();
  const botId = GEMINI_BOT_CONFIG.id;
  const isSelected = selectedChat === botId;

  // Don't render if search doesn't match
  if (!filterGeminiBotBySearch(searchValue)) return null;

  return (
    <ListItem
      onClick={() => onChatSelect(botId)}
      // TODO: Create a shared style for all chat list items
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
      {/* Avatar */}
      <Badge color='secondary' variant='dot' sx={{ mr: 2 }} overlap='circular'>
        {GEMINI_BOT_CONFIG.avatar ? (
          <Avatar sx={{ bgcolor: GEMINI_BOT_CONFIG.avatar?.backgroundColor }}>
            {GEMINI_BOT_CONFIG.avatar?.text}
          </Avatar>
        ) : (
          <Avatar sx={{ bgcolor: generateAvatarColor(GEMINI_BOT_CONFIG.id) }}>
            {GEMINI_BOT_CONFIG.displayName.charAt(0).toUpperCase()}
          </Avatar>
        )}
      </Badge>

      {/* Bot name and description */}
      <ListItemText
        primary={
          <Typography
            variant='subtitle2'
            sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}
          >
            {GEMINI_BOT_CONFIG.displayName}
          </Typography>
        }
        secondary={
          <Typography variant='body2' color='text.secondary'>
            {isSelected
              ? 'Currently chatting... 🤖'
              : GEMINI_BOT_CONFIG.description}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default GeminiBot;
