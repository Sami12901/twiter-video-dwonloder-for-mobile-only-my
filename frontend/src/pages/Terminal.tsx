import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Terminal as TerminalIcon } from 'lucide-react';

interface LogEntry {
  type: 'input' | 'output' | 'error';
  content: string;
}

export const Terminal = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    { type: 'output', content: 'Nexus Termux System v1.0.0\nType "help" for a list of commands.' }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const currentCommand = command.trim();
    setHistory(prev => [...prev, { type: 'input', content: `$ ${currentCommand}` }]);
    setCommand('');

    if (currentCommand.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    try {
      const response = await api.post('/downloader/terminal/command', { command: currentCommand });
      setHistory(prev => [...prev, { type: 'output', content: response.data.output }]);
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', content: err.response?.data?.output || 'Command failed execution.' }]);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full" style={{ height: 'calc(100dvh - 8rem)' }}>
      <div className="flex items-center gap-2 mb-4">
        <TerminalIcon className="text-[var(--color-primary)]" size={28} />
        <h1 className="text-2xl font-bold">System Terminal</h1>
      </div>

      <div className="flex-1 bg-black rounded-xl border border-gray-800 overflow-hidden flex flex-col font-mono text-sm shadow-xl">
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {history.map((log, index) => (
            <div 
              key={index} 
              className={`mb-2 whitespace-pre-wrap ${
                log.type === 'input' ? 'text-blue-400 font-bold' :
                log.type === 'error' ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {log.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-2 bg-gray-900 border-t border-gray-800 flex items-center">
          <span className="text-blue-400 font-bold mr-2">$</span>
          <form onSubmit={handleSubmit} className="flex-1">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-transparent text-green-400 focus:outline-none placeholder-gray-600"
              placeholder="Enter command..."
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </div>
      </div>
    </div>
  );
};
