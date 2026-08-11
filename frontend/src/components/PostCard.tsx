import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Repeat2, Share } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    profile?: {
      displayName?: string;
    };
  };
}

export const PostCard = ({ post }: { post: Post }) => {
  const displayName = post.user.profile?.displayName || post.user.username;
  const time = new Date(post.createdAt).toLocaleDateString();

  return (
    <div className="p-4 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <Link to={`/profile/${post.user.username}`} className="font-bold text-[var(--text)] hover:underline">
              {displayName}
            </Link>
            <span className="text-[var(--text-muted)] text-sm">@{post.user.username}</span>
            <span className="text-[var(--text-muted)] text-sm">· {time}</span>
          </div>
          <div className="mt-1 text-[var(--text)] whitespace-pre-wrap break-words">
            {post.content}
          </div>
          <div className="flex justify-between items-center mt-3 text-[var(--text-muted)] max-w-md">
            <button className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-[var(--color-primary)]/10 transition-colors">
                <MessageCircle size={18} />
              </div>
            </button>
            <button className="flex items-center gap-1 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 size={18} />
              </div>
            </button>
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart size={18} />
              </div>
            </button>
            <button className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-[var(--color-primary)]/10 transition-colors">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
