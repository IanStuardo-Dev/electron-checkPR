import React from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon, CommandLineIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { Comment, LogMessage } from './pr-detail.data';

export const PRDetailConsole = ({
  logs,
  isRunning,
}: {
  logs: LogMessage[];
  isRunning: boolean;
}) => (
  <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm">
    <div className="flex items-center gap-2 mb-3 text-slate-400 border-b border-slate-700 pb-2">
      <CommandLineIcon className="w-5 h-5" />
      <span>Console Output</span>
    </div>
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {logs.map((log) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`
            ${log.type === 'error' ? 'text-red-400' : ''}
            ${log.type === 'warning' ? 'text-yellow-400' : ''}
            ${log.type === 'success' ? 'text-green-400' : ''}
            ${log.type === 'info' ? 'text-blue-400' : ''}
          `}
        >
          <span className="text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
          <span className="ml-2">{log.message}</span>
        </motion.div>
      ))}
      {isRunning ? (
        <motion.div
          animate={{ opacity: [0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-slate-400"
        >
          ▋
        </motion.div>
      ) : null}
    </div>
  </div>
);

export const PRDetailCommentsPanel = ({
  comments,
  newComment,
  onCommentChange,
}: {
  comments: Comment[];
  newComment: string;
  onCommentChange: (value: string) => void;
}) => (
  <div className="col-span-1 bg-white rounded-xl p-6 shadow-sm">
    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
      <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
      Comments
    </h3>
    <div className="space-y-4">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-4">
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{comment.author}</span>
                  <span className="text-gray-500">{comment.timestamp.toLocaleString()}</span>
                </div>
                <p className="mt-2 text-gray-700">{comment.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-2 sticky bottom-0 bg-white pt-4">
        <input
          type="text"
          value={newComment}
          onChange={(event) => onCommentChange(event.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add a comment..."
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 whitespace-nowrap"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          Comment
        </motion.button>
      </div>
    </div>
  </div>
);
