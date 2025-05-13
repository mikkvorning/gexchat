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
    id: 'paddy_pub_group',
    type: 'group',
    name: "Paddy's Pub Legal Issues",
    participants: [
      { userId: 'lawyer', role: 'admin', joinedAt: new Date('2025-05-10') },
      { userId: 'dennis', role: 'member', joinedAt: new Date('2025-05-10') },
      { userId: 'mac', role: 'member', joinedAt: new Date('2025-05-10') },
      { userId: 'charlie', role: 'member', joinedAt: new Date('2025-05-10') },
      { userId: 'dee', role: 'member', joinedAt: new Date('2025-05-10') },
      { userId: 'frank', role: 'member', joinedAt: new Date('2025-05-10') },
    ],
    createdAt: new Date('2025-05-10'),
    unreadCount: 5,
    lastMessage: {
      id: 'msg_group_latest',
      chatId: 'paddy_pub_group',
      senderId: 'frank',
      content:
        "I don't know how many years on this Earth I got left. I'm gonna get real weird with these lawsuits.",
      timestamp: new Date('2025-05-13T11:00:00'),
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
  paddy_pub_group: [
    {
      id: 'group_1',
      chatId: 'paddy_pub_group',
      senderId: 'lawyer',
      content:
        "As your legal counsel, I must advise against your plan to serve 'riot punch' at the children's beauty pageant.",
      timestamp: new Date('2025-05-13T10:30:00'),
    },
    {
      id: 'group_2',
      chatId: 'paddy_pub_group',
      senderId: 'mac',
      content:
        'First of all, through God all things are possible, so jot that down.',
      timestamp: new Date('2025-05-13T10:35:00'),
    },
    {
      id: 'group_3',
      chatId: 'paddy_pub_group',
      senderId: 'dee',
      content:
        "I'll get my brother's girlfriend. She's a lawyer... or at least she handled my thing with the billboard.",
      timestamp: new Date('2025-05-13T10:45:00'),
    },
    {
      id: 'group_4',
      chatId: 'paddy_pub_group',
      senderId: 'frank',
      content:
        "I don't know how many years on this Earth I got left. I'm gonna get real weird with these lawsuits.",
      timestamp: new Date('2025-05-13T11:00:00'),
    },
  ],
};
