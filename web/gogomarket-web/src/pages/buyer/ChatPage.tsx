import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Send, MessageCircle, Wifi, WifiOff } from 'lucide-react';

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  courierId?: string;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  }
}

export default function ChatPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeChat, setActiveChat] = useState<'seller' | 'courier'>('seller');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((data: unknown) => {
    const messageData = data as Message;
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === messageData.id)) {
        return prev;
      }
      return [...prev, messageData];
    });
  }, []);

  // Handle typing indicator
  const handleUserTyping = useCallback((data: unknown) => {
    const typingData = data as { userId: string; isTyping: boolean };
    if (typingData.userId !== user?.id) {
      setIsTyping(typingData.isTyping);
    }
  }, [user?.id]);

  // Handle messages read
  const handleMessagesRead = useCallback((data: unknown) => {
    const readData = data as { orderId: string; readBy: string };
    if (readData.readBy !== user?.id) {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id ? { ...m, isRead: true } : m
        )
      );
    }
  }, [user?.id]);

  // Connect to WebSocket
  useEffect(() => {
    if (token && orderId) {
      socketService.connect(token);
      
      // Check connection status
      const checkConnection = setInterval(() => {
        setIsConnected(socketService.isConnected());
      }, 1000);

      // Join order room
      setTimeout(() => {
        socketService.joinOrder(orderId);
      }, 500);

      // Subscribe to events
      socketService.on('new_message', handleNewMessage);
      socketService.on('user_typing', handleUserTyping);
      socketService.on('messages_read', handleMessagesRead);

      return () => {
        clearInterval(checkConnection);
        socketService.leaveOrder(orderId);
        socketService.off('new_message', handleNewMessage);
        socketService.off('user_typing', handleUserTyping);
        socketService.off('messages_read', handleMessagesRead);
      };
    }
  }, [token, orderId, handleNewMessage, handleUserTyping, handleMessagesRead]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      loadMessages();
    }
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrder = async () => {
    try {
      const response = await api.getOrder(orderId!) as { success: boolean; data: Order };
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.getMessages(orderId!) as { success: boolean; data: Message[] };
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !order || !user) return;

      const receiverId = activeChat === 'seller' ? order.sellerId : order.courierId;
      if (!receiverId) return;

      setIsSending(true);
      try {
        // Send via WebSocket if connected, otherwise fallback to REST API
        if (isConnected) {
          socketService.sendMessage(orderId!, receiverId, newMessage.trim());
          setNewMessage('');
          // Clear typing indicator
          socketService.sendTyping(orderId!, false);
        } else {
          const response = await api.sendMessage(orderId!, newMessage.trim(), receiverId) as { success: boolean; data: Message };
          if (response.success) {
            setMessages([...messages, response.data]);
            setNewMessage('');
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    };

    // Handle typing indicator on input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
    
      if (isConnected && orderId) {
        // Send typing indicator
        socketService.sendTyping(orderId, true);
      
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      
        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          socketService.sendTyping(orderId, false);
        }, 2000);
      }
    };

  const filteredMessages = messages.filter((msg) => {
    if (activeChat === 'seller') {
      return (
        (msg.senderId === user?.id && msg.receiverId === order?.sellerId) ||
        (msg.senderId === order?.sellerId && msg.receiverId === user?.id)
      );
    } else {
      return (
        (msg.senderId === user?.id && msg.receiverId === order?.courierId) ||
        (msg.senderId === order?.courierId && msg.receiverId === user?.id)
      );
    }
  });

  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  filteredMessages.forEach((msg) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  const getChatPartner = () => {
    if (activeChat === 'seller' && order?.seller) {
      return `${order.seller.firstName} ${order.seller.lastName}`;
    } else if (activeChat === 'courier' && order?.courier) {
      return `${order.courier.firstName} ${order.courier.lastName}`;
    }
    return activeChat === 'seller' ? 'Продавец' : 'Курьер';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="mb-4">
          <Link to={`/orders/${orderId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к заказу
          </Link>
        </div>

        <Card className="h-[calc(100vh-120px)] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Чат по заказу #{order?.orderNumber || '...'}
                          {isConnected ? (
                            <Wifi className="w-4 h-4 text-green-500" title="Подключено" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-gray-400" title="Не подключено" />
                          )}
                        </CardTitle>
                      </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={activeChat === 'seller' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChat('seller')}
                className={activeChat === 'seller' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Продавец
              </Button>
              {order?.courierId && (
                <Button
                  variant={activeChat === 'courier' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveChat('courier')}
                  className={activeChat === 'courier' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Курьер
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4">
                {groupedMessages.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="text-center text-xs text-gray-500 my-4">
                      {group.date}
                    </div>
                    {group.messages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-orange-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                              {isOwn && message.isRead && ' • Прочитано'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                            <div ref={messagesEndRef} />
                            {isTyping && (
                              <div className="flex justify-start mb-2">
                                <div className="bg-gray-100 rounded-lg px-4 py-2">
                                  <p className="text-sm text-gray-500 italic">печатает...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                <p>Нет сообщений</p>
                <p className="text-sm">Напишите {getChatPartner()}</p>
              </div>
            )}
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                              value={newMessage}
                              onChange={handleInputChange}
                              placeholder={`Написать ${getChatPartner()}...`}
                              disabled={isSending || (activeChat === 'courier' && !order?.courierId)}
                              className="flex-1"
                            />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending || (activeChat === 'courier' && !order?.courierId)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {activeChat === 'courier' && !order?.courierId && (
              <p className="text-xs text-gray-500 mt-2">
                Курьер еще не назначен на этот заказ
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
