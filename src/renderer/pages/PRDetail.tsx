import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ChatBubbleLeftIcon,
  ShieldCheckIcon,
  BeakerIcon,
  LinkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { CommandLineIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  avatar?: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
}

interface LogMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

const PRDetail = () => {
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'John Doe',
      content: 'Please review the authentication flow',
      timestamp: new Date('2024-01-20T10:00:00'),
    },
    {
      id: '2',
      author: 'Jane Smith',
      content: 'The error handling looks good, but we might want to add more logging',
      timestamp: new Date('2024-01-20T11:30:00'),
    }
  ]);
  
  const [taskDetail] = useState<TaskDetail>({
    id: 'HU-123',
    title: 'Implement User Authentication',
    description: 'Add secure authentication flow using JWT tokens and implement password reset functionality',
    status: 'In Progress',
    assignee: 'John Doe',
    priority: 'High'
  });

  const [newComment, setNewComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTestingRunning, setIsTestingRunning] = useState(false);

  const handleApprove = () => {
    // Implementar lógica de aprobación
    new Notification('PR Approved', {
      body: `Pull Request #${id} has been approved`
    });
  };

  const handleReject = () => {
    // Implementar lógica de rechazo
    new Notification('PR Rejected', {
      body: `Pull Request #${id} has been rejected`
    });
  };

  const [logs, setLogs] = useState<LogMessage[]>([]);

  const addLog = (message: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }]);
  };

  const addAutoComment = (content: string) => {
    const newComment = {
      id: Date.now().toString(),
      author: 'System',
      content,
      timestamp: new Date()
    };
    setComments(prev => [...prev, newComment]);
  };

  // Añadir nuevos estados
  const [securityChecked, setSecurityChecked] = useState(false);
  const [testsChecked, setTestsChecked] = useState(false);
  
  // Actualizar las funciones
  const runSecurityScan = async () => {
    setIsAnalyzing(true);
    setLogs([]);
    
    addLog('🚀 Starting security scan...', 'info');
    
    setTimeout(() => {
      addLog('📑 Analyzing dependencies...', 'info');
    }, 1000);
    
    setTimeout(() => {
      addLog('✅ No vulnerable dependencies found', 'success');
    }, 2000);
    
    setTimeout(() => {
      addLog('🔍 Scanning code patterns...', 'info');
    }, 3000);
    
    setTimeout(() => {
      addLog('⚠️ Found potential SQL injection risk in login.ts', 'warning');
    }, 4000);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setSecurityChecked(true); // Actualizar estado
      addLog('✨ Security scan completed', 'success');
      addAutoComment('Security scan completed: Found 1 potential vulnerability (SQL injection risk in login.ts)');
      new Notification('Security Scan Complete', {
        body: 'Analysis completed with 1 warning'
      });
    }, 5000);
  };

  const runTests = async () => {
    setIsTestingRunning(true);
    setLogs([]);
    
    addLog('🧪 Starting test suite...', 'info');
    
    setTimeout(() => {
      addLog('📦 Loading test environment...', 'info');
    }, 1000);
    
    setTimeout(() => {
      addLog('✅ auth.test.ts: 12 tests passed', 'success');
    }, 2000);
    
    setTimeout(() => {
      addLog('✅ api.test.ts: 8 tests passed', 'success');
    }, 3000);
    
    setTimeout(() => {
      addLog('❌ user.test.ts: 1 test failed', 'error');
      addLog('  → expect(user.isAdmin).toBe(true)', 'error');
    }, 4000);
    
    setTimeout(() => {
      setIsTestingRunning(false);
      setTestsChecked(true); // Actualizar estado
      addLog('✨ Test suite completed', 'success');
      addAutoComment('Test suite completed: 20 passed, 1 failed\n- Failed test in user.test.ts: expect(user.isAdmin).toBe(true)');
      new Notification('Tests Completed', {
        body: '20 passed, 1 failed'
      });
    }, 5000);
  };

  // Actualizar el layout
  return (
    <div className="space-y-6">
      {/* Header con botones de acción */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Pull Request #{id}</h2>
          <p className="text-gray-500 mt-1">Created by John Doe • Updated 2 hours ago</p>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApprove}
            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Approve
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReject}
            className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
          >
            <XCircleIcon className="w-5 h-5" />
            Reject
          </motion.button>
        </div>
      </div>

      {/* Grid de contenido principal */}
      <div className="grid grid-cols-2 gap-6">
        {/* Columna izquierda: Detalles de la tarea */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Linked Task
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-blue-700">{taskDetail.id}</span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {taskDetail.priority}
                  </span>
                </div>
                <h4 className="font-medium mt-2">{taskDetail.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{taskDetail.description}</p>
                <div className="flex items-center gap-2 mt-4">
                  <UserCircleIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{taskDetail.assignee}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runSecurityScan}
              className="w-full p-4 bg-indigo-50 rounded-lg flex items-center gap-3 hover:bg-indigo-100"
              disabled={isAnalyzing}
            >
              <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
              <span className="text-indigo-700">
                {isAnalyzing ? 'Analyzing...' : 'Run Security Scan'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runTests}
              className="w-full p-4 bg-amber-50 rounded-lg flex items-center gap-3 hover:bg-amber-100"
              disabled={isTestingRunning}
            >
              <BeakerIcon className="w-6 h-6 text-amber-600" />
              <span className="text-amber-700">
                {isTestingRunning ? 'Running Tests...' : 'Run Unit Tests'}
              </span>
            </motion.button>
          </div>

          {/* Console Output */}
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm">
            <div className="flex items-center gap-2 mb-3 text-slate-400 border-b border-slate-700 pb-2">
              <CommandLineIcon className="w-5 h-5" />
              <span>Console Output</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {logs.map(log => (
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
              {(isAnalyzing || isTestingRunning) && (
                <motion.div
                  animate={{ opacity: [0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-slate-400"
                >
                  ▋
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: Comentarios */}
        <div className="col-span-1 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
            Comments
          </h3>
          <div className="space-y-4">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-4">
              {comments.map(comment => (
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
                        <span className="text-gray-500">
                          {comment.timestamp.toLocaleString()}
                        </span>
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
                onChange={(e) => setNewComment(e.target.value)}
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
      </div>
    </div>
  );
};

export default PRDetail;