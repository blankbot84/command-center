import { Chat } from '@/components/chat';

export const metadata = {
  title: 'Chat - Command Center',
  description: 'AI Chat Interface',
};

export default function ChatPage() {
  return (
    <main className="h-screen">
      <Chat />
    </main>
  );
}
