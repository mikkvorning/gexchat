import React from 'react';
import { Box } from '../../../../app/muiImports';
import ChatHeader from '../../../Chat/ChatHeader';
import ChatMessages from '../../../Chat/ChatMessages';
import GeminiBotInput from './GeminiBotInput';
import { useGeminiBotChat } from './useGeminiBotChat';

const GeminiBotChatView: React.FC<{ userId: string }> = ({ userId }) => {
  const { messages, isLoading, sendMessage, messagesEndRef } =
    useGeminiBotChat(userId);

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
      <GeminiBotInput isLoading={isLoading} onSend={sendMessage} />
    </Box>
  );
};

export default GeminiBotChatView;
