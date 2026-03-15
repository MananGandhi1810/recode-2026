import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#282a36] text-[#bd93f9] font-bold text-xl">Loading chat...</div>}>
      <ChatPageClient />
    </Suspense>
  );
}
