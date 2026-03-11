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
import { PRDetailCommentsPanel, PRDetailConsole } from '../features/demo/PRDetailPanels';
import { initialComments, initialTaskDetail, type Comment, type LogMessage, type TaskDetail } from '../features/demo/pr-detail.data';

const PRDetail = () => {
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  
  const [taskDetail] = useState<TaskDetail>(initialTaskDetail);

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
          <PRDetailConsole logs={logs} isRunning={isAnalyzing || isTestingRunning} />
        </div>

        <PRDetailCommentsPanel comments={comments} newComment={newComment} onCommentChange={setNewComment} />
      </div>
    </div>
  );
};

export default PRDetail;
