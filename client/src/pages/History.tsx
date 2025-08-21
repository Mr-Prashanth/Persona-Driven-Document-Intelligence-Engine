import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiFileText, FiTrash2, FiEdit } from 'react-icons/fi';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';
import { Input } from '../components/ui/input-enhanced';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const History: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/chat/chats_history', {
          withCredentials: true,
          
        });

        // transform API response to session format
        const transformed = res.data.chats.map((chat) => ({
          id: chat.chatId.toString(),
          title: chat.persona || "Untitled Chat",
          insights: chat.insights || 'N/A',
          date: chat.createdAt || new Date().toISOString(),
          fileCount: chat.pdfs?.length || 0,
          preview: chat.insights || "—"
        }));

        setSessions(transformed);
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };

    fetchHistory();
  }, []);

  const deleteSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.persona.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-vectra-dark relative overflow-hidden">
      <ParticleBackground />
      
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass border-b border-vectra-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-vectra-text-primary">Chat History</h1>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vectra-text-secondary" />
            <Input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-vectra-surface/50 border-vectra-border"
            />
          </div>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/session/${session.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiFileText className="text-primary" />
                    <h3 className="font-medium text-vectra-text-primary group-hover:text-primary transition-colors">
                      {session.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-vectra-text-secondary mb-3">
                    <span className="flex items-center space-x-1">
                      <FiCalendar size={14} />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </span>
                    <span>{session.fileCount} file{session.fileCount > 1 ? 's' : ''}</span>
                    <span className="px-2 py-1 bg-vectra-surface rounded text-xs">
                      {session.persona}
                    </span>
                  </div>
                  
                  <p className="text-sm text-vectra-text-secondary line-clamp-2">
                    {session.preview}
                  </p>
                </div>

                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FiEdit size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FiTrash2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FiFileText size={48} className="mx-auto text-vectra-text-secondary/50 mb-4" />
            <p className="text-vectra-text-secondary">
              {searchQuery ? 'No sessions match your search.' : 'No chat history yet.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default History;
