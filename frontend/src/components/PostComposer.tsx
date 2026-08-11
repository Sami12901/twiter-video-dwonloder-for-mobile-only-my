import React, { useState } from 'react';
import { api } from '../services/api';

export const PostComposer = ({ onPostCreated }: { onPostCreated: () => void }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/posts', { content });
      setContent('');
      onPostCreated();
    } catch (error) {
      console.error('Failed to create post', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] p-4 border-b border-[var(--border)]">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What is happening?!"
          className="w-full bg-transparent text-[var(--text)] text-lg resize-none focus:outline-none min-h-[80px]"
          maxLength={280}
        />
        <div className="flex justify-between items-center mt-2 border-t border-[var(--border)] pt-3">
          <div className="text-[var(--text-muted)] text-sm">
            {content.length} / 280
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-[var(--color-primary)] text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};
