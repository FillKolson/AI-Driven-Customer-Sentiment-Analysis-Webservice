export type Message = {
  success?: string;
  error?: string | { message: string };
  message?: string;
  code?: string;
  token?: string;
  type?: 'error' | 'success' | string;
  [key: string]: any; // Allow any additional properties
};

export function FormMessage({ message }: { message: Message }) {
  // Handle different message formats
  const getMessageContent = () => {
    if (typeof message.error === 'object' && message.error !== null && 'message' in message.error) {
      return message.error.message;
    }
    if (message.error) return message.error;
    if (message.message) return message.message;
    if (message.success) return message.success;
    return '';
  };

  const messageContent = getMessageContent();
  const isError = 'error' in message || message.type === 'error';
  const isSuccess = 'success' in message || message.type === 'success';

  if (!messageContent) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      <div 
        className={`border-l-2 px-4 ${
          isError 
            ? 'text-red-500 border-red-500' 
            : isSuccess 
              ? 'text-green-500 border-green-500' 
              : 'text-foreground'
        }`}
      >
        {messageContent}
      </div>
    </div>
  );
}
