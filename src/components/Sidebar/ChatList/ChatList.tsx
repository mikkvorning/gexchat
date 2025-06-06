import React, { useMemo } from 'react';
import {
  Avatar,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '../../../app/muiImports';
import { mockContacts } from '../../../mock/mockData';
import { shouldUseWhiteText, generateAvatarColor } from '../../../utils/colors';
import { useSidebar } from '../SidebarProvider';

interface ChatListProps {
  onContactSelect: (contactId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onContactSelect }) => {
  const { filteredContacts } = useSidebar();

  // Generate stable color mappings that persist between renders
  const contactColors = useMemo(() => {
    return mockContacts.reduce(
      (acc, contact) => ({
        ...acc,
        [contact.id]: generateAvatarColor(contact.id),
      }),
      {} as Record<string, string>
    );
  }, []); // Empty deps since mockContacts is static

  const { online, offline } = filteredContacts;

  return (
    <List>
      {/* Online Contacts Section */}
      {online.length > 0 && (
        <>
          <ListItem sx={{ px: 1 }}>
            <Typography variant='subtitle2' color='text.secondary'>
              Online — {online.length}
            </Typography>
          </ListItem>
          {online.map((contact) => (
            <ListItem
              onClick={() => onContactSelect(contact.id)}
              key={contact.id}
              sx={{ borderRadius: 1, cursor: 'pointer', py: 0 }}
            >
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: contactColors[contact.id],
                  color: shouldUseWhiteText(contactColors[contact.id])
                    ? 'white'
                    : 'black',
                }}
              >
                {contact.displayName[0].toUpperCase()}
              </Avatar>
              <ListItemText
                primary={contact.displayName}
                secondary={contact.status}
              />
            </ListItem>
          ))}
        </>
      )}

      {/* Offline Contacts Section */}
      {offline.length > 0 && (
        <>
          <ListItem sx={{ px: 1, mt: 2 }}>
            <Typography variant='subtitle2' color='text.secondary'>
              Offline — {offline.length}
            </Typography>
          </ListItem>
          {offline.map((contact) => (
            <ListItem
              onClick={() => onContactSelect(contact.id)}
              key={contact.id}
              sx={{ borderRadius: 1, mb: 0.5, cursor: 'pointer', py: 0 }}
            >
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: contactColors[contact.id],
                  color: shouldUseWhiteText(contactColors[contact.id])
                    ? 'white'
                    : 'black',
                }}
              >
                {contact.displayName[0].toUpperCase()}
              </Avatar>
              <ListItemText
                primary={contact.displayName}
                secondary={contact.status}
              />
            </ListItem>
          ))}
        </>
      )}
    </List>
  );
};

export default ChatList;
