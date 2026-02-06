import { AIMessage } from "./AIMessage";
import { ErrorMessage } from "./ErrorMessage";
import { HumanMessage } from "./HumanMessage";

import React, { memo } from "react";

const MessageList = memo(
  ({
    error,
    messages,
    selectedId,
    messagesEndRef,
    highlightedMessage,
    onErrorClose,
  }: {
    error?: string;
    messages: { id: string; content: string; role: string }[];
    selectedId: string;
    messagesEndRef: { current: HTMLDivElement | null };
    highlightedMessage: { current: HTMLDivElement | null };
    onErrorClose: () => void;
  }) => (
    <>
      <AIMessage content="Hi, How can I help you today?" />
      {messages.map((item, index) => {
        const isLastMessage = index === messages.length - 1;
        const isSelected = item.id === selectedId;

        return item.role === "USER" ? (
          <HumanMessage
            key={item.id || index}
            message={item}
            selectedId={selectedId}
            messageRef={isSelected ? highlightedMessage : undefined}
          />
        ) : (
          <AIMessage
            key={item.id || index}
            content={item.content}
            messageRef={isLastMessage ? messagesEndRef : undefined}
          />
        );
      })}
      {error && (
        <ErrorMessage
          key="error-message"
          content={error}
          onClose={onErrorClose}
        />
      )}
    </>
  )
);

export { MessageList };
