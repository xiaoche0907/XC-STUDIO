import React from 'react';

interface MessageAttachmentsProps {
  attachments?: string[];
  onPreview?: (url: string) => void;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onPreview,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-1">
      {attachments.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onPreview?.(url)}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg pl-1 pr-2 py-0.5 select-none hover:bg-gray-50 transition duration-200 cursor-pointer shadow-sm"
          title={`参考内容 ${index + 1}`}
        >
          <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 bg-white">
            <img src={url} className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">
            参考内容 {index + 1}
          </span>
        </button>
      ))}
    </div>
  );
};
