import { Chat, Message, BaseUser } from '../types/types';

// The lawyer (current user)
export const currentUser: BaseUser = {
  id: 'lawyer',
  username: 'jewish_lawyer',
  displayName: 'Brian Unger',
  status: 'online',
};

export const mockContacts: BaseUser[] = [
  {
    id: 'dennis',
    username: 'golden_god',
    displayName: 'Dennis Reynolds',
    status: 'online',
  },
  {
    id: 'charlie',
    username: 'king_of_rats',
    displayName: 'Charlie Kelly',
    status: 'away',
  },
  {
    id: 'mac',
    username: 'sheriff_of_paddy',
    displayName: 'Mac',
    status: 'online',
  },
  {
    id: 'dee',
    username: 'sweet_dee',
    displayName: 'Dee Reynolds',
    status: 'offline',
  },
  {
    id: 'frank',
    username: 'dr_mantis',
    displayName: 'Frank Reynolds',
    status: 'online',
  },
  {
    id: 'cricket',
    username: 'street_rat',
    displayName: 'Rickety Cricket',
    status: 'offline',
  },
  {
    id: 'waitress',
    username: 'coffee_server',
    displayName: 'The Waitress',
    status: 'away',
  },
];

export const mockChats: Chat[] = [
  {
    id: 'chat_dennis',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-13') },
      { userId: 'dennis', role: 'member', joinedAt: new Date('2025-05-13') },
    ],
    createdAt: new Date('2025-05-13'),
    unreadCount: 2,
    lastMessage: {
      id: 'msg_dennis_latest',
      chatId: 'chat_dennis',
      senderId: 'dennis',
      content:
        "I am untethered and my rage knows no bounds! You'll be hearing from ME about that restraining order!",
      timestamp: new Date('2025-05-13T10:30:00'),
    },
  },
  {
    id: 'chat_charlie',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-12') },
      { userId: 'charlie', role: 'member', joinedAt: new Date('2025-05-12') },
    ],
    createdAt: new Date('2025-05-12'),
    unreadCount: 1,
    lastMessage: {
      id: 'msg_charlie_latest',
      chatId: 'chat_charlie',
      senderId: 'charlie',
      content:
        'Filibuster! I know a lot about the law and various other lawyerings. I challenge you to a duel!',
      timestamp: new Date('2025-05-13T09:15:00'),
    },
  },
  {
    id: 'chat_mac',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-11') },
      { userId: 'mac', role: 'member', joinedAt: new Date('2025-05-11') },
    ],
    createdAt: new Date('2025-05-11'),
    unreadCount: 3,
    lastMessage: {
      id: 'msg_mac_latest',
      chatId: 'chat_mac',
      senderId: 'mac',
      content:
        "I've performed an ocular patdown and assessed that this contract is NOT a security risk.",
      timestamp: new Date('2025-05-13T14:20:00'),
    },
  },
  {
    id: 'chat_dee',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-10') },
      { userId: 'dee', role: 'member', joinedAt: new Date('2025-05-10') },
    ],
    createdAt: new Date('2025-05-10'),
    unreadCount: 0,
    lastMessage: {
      id: 'msg_dee_latest',
      chatId: 'chat_dee',
      senderId: 'dee',
      content:
        "I'm not paying damages for that comedy club incident. Those people should thank me for my sweet jokes!",
      timestamp: new Date('2025-05-13T15:45:00'),
    },
  },
  {
    id: 'chat_frank',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-09') },
      { userId: 'frank', role: 'member', joinedAt: new Date('2025-05-09') },
    ],
    createdAt: new Date('2025-05-09'),
    unreadCount: 4,
    lastMessage: {
      id: 'msg_frank_latest',
      chatId: 'chat_frank',
      senderId: 'frank',
      content:
        'Listen, about that toe knife incident... can we settle this out of court with an egg?',
      timestamp: new Date('2025-05-13T16:30:00'),
    },
  },
  {
    id: 'chat_cricket',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-08') },
      { userId: 'cricket', role: 'member', joinedAt: new Date('2025-05-08') },
    ],
    createdAt: new Date('2025-05-08'),
    unreadCount: 1,
    lastMessage: {
      id: 'msg_cricket_latest',
      chatId: 'chat_cricket',
      senderId: 'cricket',
      content:
        "Can we sue Paddy's Pub for my facial disfigurement? I have... documentation.",
      timestamp: new Date('2025-05-13T17:15:00'),
    },
  },
  {
    id: 'chat_waitress',
    type: 'direct',
    participants: [
      { userId: 'lawyer', role: 'member', joinedAt: new Date('2025-05-07') },
      { userId: 'waitress', role: 'member', joinedAt: new Date('2025-05-07') },
    ],
    createdAt: new Date('2025-05-07'),
    unreadCount: 2,
    lastMessage: {
      id: 'msg_waitress_latest',
      chatId: 'chat_waitress',
      senderId: 'waitress',
      content:
        "I need ANOTHER restraining order against Charlie. He's been leaving cats outside my door again.",
      timestamp: new Date('2025-05-13T18:00:00'),
    },
  },
];

// Mock messages for each chat
export const mockMessages: { [chatId: string]: Message[] } = {
  chat_dennis: [
    {
      id: 'dennis_1',
      chatId: 'chat_dennis',
      senderId: 'lawyer',
      content:
        "Mr. Reynolds, this is the third time I've had to inform you that you cannot sue someone for not recognizing your 'five-star man' status.",
      timestamp: new Date('2025-05-13T10:15:00'),
    },
    {
      id: 'dennis_2',
      chatId: 'chat_dennis',
      senderId: 'dennis',
      content:
        "I am untethered and my rage knows no bounds! You'll be hearing from ME about that restraining order!",
      timestamp: new Date('2025-05-13T10:30:00'),
    },
  ],
  chat_charlie: [
    {
      id: 'charlie_1',
      chatId: 'chat_charlie',
      senderId: 'lawyer',
      content:
        "Mr. Kelly, please stop sending me documents written in crayon. And no, 'bird law' is not a recognized specialty.",
      timestamp: new Date('2025-05-13T09:00:00'),
    },
    {
      id: 'charlie_2',
      chatId: 'chat_charlie',
      senderId: 'charlie',
      content:
        'Filibuster! I know a lot about the law and various other lawyerings. I challenge you to a duel!',
      timestamp: new Date('2025-05-13T09:15:00'),
    },
  ],
  chat_mac: [
    {
      id: 'mac_1',
      chatId: 'chat_mac',
      senderId: 'mac',
      content:
        "As head of security at Paddy's, I need legal advice about my right to perform ocular pat-downs.",
      timestamp: new Date('2025-05-13T14:00:00'),
    },
    {
      id: 'mac_2',
      chatId: 'chat_mac',
      senderId: 'lawyer',
      content:
        "That's not a real security position, and no, you cannot detain people based on their 'threat level'.",
      timestamp: new Date('2025-05-13T14:10:00'),
    },
    {
      id: 'mac_3',
      chatId: 'chat_mac',
      senderId: 'mac',
      content:
        "I've performed an ocular patdown and assessed that this contract is NOT a security risk.",
      timestamp: new Date('2025-05-13T14:20:00'),
    },
  ],
  chat_dee: [
    {
      id: 'dee_1',
      chatId: 'chat_dee',
      senderId: 'dee',
      content:
        'Hey, quick question about intellectual property - can I sue someone for stealing my Martina Martinez character?',
      timestamp: new Date('2025-05-13T15:30:00'),
    },
    {
      id: 'dee_2',
      chatId: 'chat_dee',
      senderId: 'lawyer',
      content:
        "Ms. Reynolds, we've discussed this. Those characters are highly inappropriate and potentially legally actionable AGAINST you.",
      timestamp: new Date('2025-05-13T15:35:00'),
    },
    {
      id: 'dee_3',
      chatId: 'chat_dee',
      senderId: 'dee',
      content:
        "I'm not paying damages for that comedy club incident. Those people should thank me for my sweet jokes!",
      timestamp: new Date('2025-05-13T15:45:00'),
    },
  ],
  chat_frank: [
    {
      id: 'frank_1',
      chatId: 'chat_frank',
      senderId: 'frank',
      content:
        "Need legal advice about my business - Wolf Cola. Some people are saying it's the official drink of Boko Haram?",
      timestamp: new Date('2025-05-13T16:00:00'),
    },
    {
      id: 'frank_2',
      chatId: 'chat_frank',
      senderId: 'lawyer',
      content:
        "Mr. Reynolds, cease all operations immediately. And no, we cannot 'write off' the rum ham incident as a business expense.",
      timestamp: new Date('2025-05-13T16:15:00'),
    },
    {
      id: 'frank_3',
      chatId: 'chat_frank',
      senderId: 'frank',
      content:
        'Listen, about that toe knife incident... can we settle this out of court with an egg?',
      timestamp: new Date('2025-05-13T16:30:00'),
    },
  ],
  chat_cricket: [
    {
      id: 'cricket_1',
      chatId: 'chat_cricket',
      senderId: 'cricket',
      content:
        'Hey, remember when I was a priest? Before the gang ruined my life? Good times...',
      timestamp: new Date('2025-05-13T17:00:00'),
    },
    {
      id: 'cricket_2',
      chatId: 'chat_cricket',
      senderId: 'lawyer',
      content:
        'Mr. Cricket, we might have a strong personal injury case here. Several, actually.',
      timestamp: new Date('2025-05-13T17:10:00'),
    },
    {
      id: 'cricket_3',
      chatId: 'chat_cricket',
      senderId: 'cricket',
      content:
        "Can we sue Paddy's Pub for my facial disfigurement? I have... documentation.",
      timestamp: new Date('2025-05-13T17:15:00'),
    },
  ],
  chat_waitress: [
    {
      id: 'waitress_1',
      chatId: 'chat_waitress',
      senderId: 'waitress',
      content:
        "I need to update my restraining order against Charlie. He's been leaving love letters in my apartment.",
      timestamp: new Date('2025-05-13T17:45:00'),
    },
    {
      id: 'waitress_2',
      chatId: 'chat_waitress',
      senderId: 'lawyer',
      content:
        "I'll draft a new order right away. How did he get into your apartment this time?",
      timestamp: new Date('2025-05-13T17:50:00'),
    },
    {
      id: 'waitress_3',
      chatId: 'chat_waitress',
      senderId: 'waitress',
      content:
        "I need ANOTHER restraining order against Charlie. He's been leaving cats outside my door again.",
      timestamp: new Date('2025-05-13T18:00:00'),
    },
  ],
};
