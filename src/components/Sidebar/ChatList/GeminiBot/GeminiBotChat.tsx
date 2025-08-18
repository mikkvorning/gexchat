import React from 'react';
import { Box } from '../../../../app/muiImports';
import ChatHeader from '../../../Chat/ChatHeader';
import ChatMessages from '../../../Chat/ChatMessages';

import { useGeminiBotChat } from './useGeminiBotChat';

const GeminiBotChat: React.FC<{ userId: string }> = ({ userId }) => {
  const { messages, messagesEndRef } = useGeminiBotChat(userId);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <ChatHeader displayName='Gemini-bot' />
      <ChatMessages
        messages={messages}
        currentUserId={userId}
        messagesEndRef={messagesEndRef}
      />
      <Box ref={messagesEndRef} />
      {/* ChatInput is now Firestore-only; GeminiBotChat should use its own input or a local input implementation if needed. For now, render nothing or a placeholder. */}
      {/* TODO: Implement a local input for GeminiBotChat or reuse logic without using ChatInput. */}
      {/* <ChatInput chatId={GEMINI_BOT_ID} userId={userId} /> */}
    </Box>
  );
};

export default GeminiBotChat;
