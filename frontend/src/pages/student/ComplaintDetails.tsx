import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import api from '@/lib/axios';
import { Complaint, Priority, ComplaintStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Calendar, User, Building, Tag, AlertTriangle, 
  Send, MessageCircle, Paperclip, CheckCircle, XCircle, Clock, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  complaintId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  sender: {
    id: string;
    role: string;
    student?: { fullName: string; profileImage?: string };
    staff?: { fullName: string; profileImage?: string };
  };
}

const ComplaintDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusComment, setStatusComment] = useState('');

  // Admin assign state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const fetchComplaint = async () => {
    try {
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data.data);
      setSelectedStaffId(response.data.data.assignedStaffId || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch complaint details.');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/complaints/${id}/messages`);
      setMessages(response.data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const fetchStaff = async () => {
    if (user?.role === 'ADMIN') {
      try {
        const response = await api.get('/admin/staff');
        setStaffList(response.data.data);
      } catch (err) {
        console.error('Failed to fetch staff list', err);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchComplaint(), fetchMessages(), fetchStaff()]);
      setLoading(false);
    };
    init();
  }, [id]);

  // Socket.io room join and real-time events
  useEffect(() => {
    if (!socket || !id) return;

    // Join room
    socket.emit('join_complaint', id);

    // Listen for new messages
    socket.on('message_received', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for typing events
    socket.on('typing', (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        setOtherPartyTyping(true);
      }
    });

    socket.on('stop_typing', (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        setOtherPartyTyping(false);
      }
    });

    return () => {
      socket.emit('leave_complaint', id);
      socket.off('message_received');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket, id, user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherPartyTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      const content = newMessage;
      setNewMessage('');
      handleStopTyping();

      const response = await api.post(`/complaints/${id}/messages`, { content });
      const createdMsg = response.data.data;

      // Local update
      setMessages((prev) => [...prev, createdMsg]);

      // Emit through socket for other party
      if (socket) {
        socket.emit('message_send', { complaintId: id, message: createdMsg });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleTyping = () => {
    if (!socket || !id) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (socket && id && isTyping) {
      setIsTyping(false);
      socket.emit('stop_typing', id);
    }
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/complaints/${id}/status`, {
        status: newStatus,
        comment: statusComment || `Status updated to ${newStatus}`
      });
      setStatusComment('');
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    try {
      setAssigning(true);
      await api.patch(`/complaints/${id}/assign`, { staffId: selectedStaffId });
      await fetchComplaint();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let classes = "px-2.5 py-0.5 rounded-full text-xs font-semibold ";
    switch (status) {
      case 'SUBMITTED': classes += 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'; break;
      case 'ASSIGNED': classes += 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'; break;
      case 'IN_PROGRESS': classes += 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'; break;
      case 'RESOLVED': classes += 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'; break;
      case 'REJECTED': classes += 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'; break;
      case 'CLOSED': classes += 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'; break;
      default: classes += 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
    return <span className={classes}>{status.replace(/_/g, ' ')}</span>;
  };

  if (loading) return <div className="text-center py-10">Loading details...</div>;
  if (error || !complaint) return <div className="text-red-500 py-10">{error || 'Complaint not found.'}</div>;

  const isStudent = user?.role === 'STUDENT';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Complaint {complaint.complaintId}
            </h2>
            {getStatusBadge(complaint.status)}
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Submitted on {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{complaint.title}</CardTitle>
              <CardDescription>Full Details & Context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm">
                {complaint.description}
              </div>

              {complaint.location && (
                <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                  <strong>Location:</strong> {complaint.location}
                </div>
              )}

              {/* Attachments */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Paperclip size={16} /> Attachments
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {complaint.attachments.map((file: any) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs border p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950"
                      >
                        <span>{file.fileName || 'View attachment'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Management Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin assignment */}
              {isAdmin && (
                <div className="space-y-3 pt-2">
                  <Label htmlFor="staff">Assign Staff Member</Label>
                  <div className="flex gap-2">
                    <select
                      id="staff"
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                    >
                      <option value="">Select Staff...</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.department?.name})
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAssign} disabled={assigning}>
                      {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Staff / Admin status updating */}
              {(isStaff || isAdmin) && (
                <div className="space-y-3">
                  <Label>Update Status & Feedback</Label>
                  <Input
                    placeholder="Add comments/feedback..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {complaint.status === 'SUBMITTED' && (
                      <>
                        <Button variant="outline" onClick={() => handleStatusChange('ASSIGNED')} disabled={updatingStatus}>
                          <Clock size={14} className="mr-1.5" /> Accept & Assign
                        </Button>
                        <Button variant="destructive" onClick={() => handleStatusChange('REJECTED')} disabled={updatingStatus}>
                          <XCircle size={14} className="mr-1.5" /> Reject
                        </Button>
                      </>
                    )}

                    {(complaint.status === 'ASSIGNED' || complaint.status === 'IN_PROGRESS') && (
                      <>
                        {complaint.status === 'ASSIGNED' && (
                          <Button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={updatingStatus}>
                            <Play size={14} className="mr-1.5" /> Start Work
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => handleStatusChange('WAITING_FOR_STUDENT')} disabled={updatingStatus}>
                          Waiting for Student
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange('RESOLVED')} disabled={updatingStatus}>
                          <CheckCircle size={14} className="mr-1.5" /> Resolve Issue
                        </Button>
                      </>
                    )}

                    {complaint.status === 'RESOLVED' && (
                      <Button variant="outline" onClick={() => handleStatusChange('CLOSED')} disabled={updatingStatus}>
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Student actions */}
              {isStudent && complaint.status === 'RESOLVED' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Staff marked this issue as resolved. Do you want to close the ticket?
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange('CLOSED')}>
                    Yes, Close Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat / Timeline Column */}
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-950 rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <MessageCircle size={18} /> Resolution Chat
            </h3>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "bg-emerald-500" : "bg-red-500")} />
              {isConnected ? 'Real-time active' : 'Connecting...'}
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-400">
                No conversation history yet. Send a message to start tracking updates.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const senderName = msg.sender.student?.fullName || msg.sender.staff?.fullName || 'User';

                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                    <span className="text-[10px] text-slate-400 mb-1 px-1">{senderName}</span>
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            
            {otherPartyTyping && (
              <div className="flex items-center gap-1 text-xs text-slate-400 italic">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
                Other party is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onBlur={handleStopTyping}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ComplaintDetails;
