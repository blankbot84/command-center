import { AppShell } from '@/components/app-shell';

export const metadata = {
  title: 'Chat - Command Center',
  description: 'AI Chat Interface',
};

export default function ChatPage() {
  return <AppShell defaultView="chat" />;
}
