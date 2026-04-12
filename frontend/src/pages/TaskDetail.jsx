import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { PriorityBadge, DevStatusBadge, TestStatusBadge, OverdueBadge } from '../components/Badge';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [pastedImage, setPastedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        setTask(res.data);
      } catch (err) {
        console.error('Failed to fetch task:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !pastedImage) return;
    
    setSubmitting(true);
    try {
      let uploadedImageUrl = null;
      if (pastedImage) {
        const formData = new FormData();
        formData.append('image', pastedImage);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      const res = await api.post(`/tasks/${id}/comments`, { 
        text: commentText,
        imageUrl: uploadedImageUrl
      });
      
      setTask(prev => ({
        ...prev,
        comments: [res.data, ...prev.comments]
      }));
      setCommentText('');
      setPastedImage(null);
      setImagePreviewUrl(null);
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        setPastedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        break;
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-xl font-bold text-gray-300">Task Not Found</p>
        <Link to="/tasks" className="text-violet-400 hover:underline mt-4 inline-block">← Back to Board</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Task Details */}
      <div className="space-y-6">
        <div>
          <Link to="/tasks" className="text-sm font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-1 mb-4">
            ← Back to Board
          </Link>
          <div className="flex gap-2 items-center mb-2 text-sm text-gray-500 font-mono">
            <span>{task.id.slice(-6).toUpperCase()}</span>
            <span>•</span>
            <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 font-sans">{task.group}</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">{task.title}</h1>
        </div>

        <div className="card p-5 space-y-5">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Priority</p>
              <PriorityBadge priority={task.priority} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dev Status</p>
              <DevStatusBadge status={task.devStatus} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Test Status</p>
              <TestStatusBadge status={task.testStatus} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tracking</p>
              <OverdueBadge overdueFlag={task.overdueFlag} overdueTeam={task.overdueTeam} isClosed={task.isClosed} />
            </div>
          </div>
          
          <hr className="border-gray-800" />
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Assigned To</p>
              {task.assignedUser ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold text-xs">
                    {task.assignedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{task.assignedUser.name}</p>
                    <p className="text-xs text-gray-500">{task.assignedUser.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Unassigned</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deadline Date</p>
              <p className={`text-sm font-medium ${new Date(task.deadline) < new Date() && !task.isClosed ? 'text-red-400' : 'text-gray-200'}`}>
                {format(new Date(task.deadline), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold text-white mb-3">Description</h2>
          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
            {task.description || <span className="text-gray-600 italic">No description provided.</span>}
          </div>
        </div>
        
        {task.notes && (
          <div className="card p-5 bg-violet-900/10 border-violet-900/30">
            <h2 className="text-lg font-bold text-violet-400 mb-3 flex items-center gap-2">
              <span>📝</span> Internal Notes
            </h2>
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {task.notes}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-violet-400">💬</span> Discussion
        </h2>
        
        <form onSubmit={handlePostComment} className="flex flex-col gap-3 mb-8">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Add a comment... (you can also explicitly paste a screenshot here!)"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none min-h-[100px]"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handlePostComment(e);
              }
            }}
          />
          
          {imagePreviewUrl && (
            <div className="relative inline-block mt-2 self-start bg-gray-900 border border-gray-700 p-2 rounded-lg">
              <button
                type="button"
                onClick={() => { setPastedImage(null); setImagePreviewUrl(null); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow hover:bg-red-400"
              >
                ✕
              </button>
              <img src={imagePreviewUrl} alt="Preview" className="max-h-32 rounded object-contain" />
              <p className="text-[10px] text-gray-500 mt-1 text-center">Attached Image</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              Press <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Cmd/Ctrl</span> + <span className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Enter</span> to send
            </span>
            <button 
              type="submit" 
              disabled={submitting || (!commentText.trim() && !pastedImage)}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {task.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
              <span className="text-3xl mb-2 grayscale opacity-50">💭</span>
              <p>No comments yet.</p>
            </div>
          ) : (
            <div className="border-t border-gray-800 pt-6">
              {task.comments.map(comment => (
                <div key={comment.id} className="flex gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex-shrink-0 flex items-center justify-center text-violet-400 font-bold text-sm mt-1">
                    {comment.user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-200">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    {comment.text && (
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                      </div>
                    )}
                    {comment.imageUrl && (
                      <div className="mt-2">
                        <img src={comment.imageUrl} alt="Attached screenshot" className="max-h-80 rounded-md border border-gray-700 max-w-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
