import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PostComposer } from '../components/PostComposer';
import { PostCard } from '../components/PostCard';

export const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts/feed');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch feed', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="flex-1 flex flex-col border-r border-l border-[var(--border)] max-w-2xl w-full">
      <div className="sticky top-0 sm:top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md p-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold">For You</h1>
      </div>
      
      <PostComposer onPostCreated={fetchFeed} />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-[var(--text-muted)]">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-muted)]">No posts yet.</div>
        ) : (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};
