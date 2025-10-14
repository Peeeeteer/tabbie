import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit3, Bold, Italic, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTodo } from '@/contexts/TodoContext';

interface NotesPageProps {
  onPageChange?: (page: 'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings' | 'notes') => void;
  theme?: 'clean' | 'retro';
}

const NotesPage: React.FC<NotesPageProps> = ({ onPageChange, theme = 'clean' }) => {
  const { userData, updateUserNotes } = useTodo();
  const [selectedView, setSelectedView] = useState<'all' | string>('all');
  const [noteContent, setNoteContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // Extract tags from note content
  const extractTags = (content: string): string[] => {
    const tagRegex = /@(\w+)/g;
    const matches = content.match(tagRegex) || [];
    return [...new Set(matches.map(tag => tag.slice(1)))]; // Remove @ and deduplicate
  };

  // Get current note content based on selected view
  useEffect(() => {
    if (selectedView === 'all') {
      const content = userData.notes?.global || '';
      setNoteContent(content);
      setTags(extractTags(content));
    } else {
      const categoryNotes = userData.notes?.categories?.[selectedView] || '';
      setNoteContent(categoryNotes);
      setTags(extractTags(categoryNotes));
    }
  }, [selectedView, userData.notes]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (!isTyping) return;

    const saveTimeout = setTimeout(() => {
      if (selectedView === 'all') {
        updateUserNotes('global', noteContent);
      } else {
        updateUserNotes('category', noteContent, selectedView);
      }
      setIsTyping(false);
    }, 1000); // Save after 1 second of no typing

    return () => clearTimeout(saveTimeout);
  }, [noteContent, selectedView, isTyping, updateUserNotes]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    setTags(extractTags(newContent));
    setIsTyping(true);
  };

  // Get categories for navigation
  const categories = userData.categories || [];

  // Scroll to tag function
  const scrollToTag = (tag: string) => {
    const textarea = document.getElementById('notes-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const tagPattern = `@${tag}`;
    const index = noteContent.indexOf(tagPattern);
    
    if (index !== -1) {
      // Calculate the line number where the tag appears
      const beforeTag = noteContent.substring(0, index);
      const lineNumber = beforeTag.split('\n').length;
      
      // Focus the textarea
      textarea.focus();
      
      // Set cursor position at the tag
      textarea.setSelectionRange(index, index + tagPattern.length);
      
      // Scroll to the tag position
      const lines = noteContent.split('\n');
      const lineHeight = 24; // Approximate line height in pixels
      const scrollTop = (lineNumber - 1) * lineHeight;
      textarea.scrollTop = scrollTop;
    }
  };

  // Format text functions
  const formatText = (format: 'bold' | 'italic' | 'list') => {
    const textarea = document.getElementById('notes-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        break;
    }

    const newContent = noteContent.substring(0, start) + formattedText + noteContent.substring(end);
    setNoteContent(newContent);
    setIsTyping(true);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  return (
    <div className="flex h-full bg-background relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header with View Navigation */}
        <div className="bg-card border-b border-border">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4 h-10">
              <h1 className="text-2xl font-bold text-foreground">Notes</h1>
            </div>

            {/* View Navigation Tabs - Aligned with Sidebar */}
            <div className="flex items-center justify-between border-b" style={{ marginLeft: '-24px', paddingLeft: '24px', marginRight: '-24px', paddingRight: '24px' }}>
              <div className="flex items-center space-x-6">
                
                {/* All Notes Tab */}
                <button
                  onClick={() => setSelectedView('all')}
                  className={
                    theme === 'retro'
                      ? `px-3 py-1.5 rounded-md font-bold text-sm transition-all whitespace-nowrap ${
                          selectedView === 'all'
                            ? 'bg-foreground text-background border-2 border-black dark:border-white shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]'
                            : 'bg-transparent text-foreground border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`
                      : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          selectedView === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    All Notes
                  </div>
                </button>

                {/* Category Notes Tabs */}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedView(category.id)}
                    className={
                      theme === 'retro'
                        ? `px-3 py-1.5 rounded-md font-bold text-sm transition-all whitespace-nowrap ${
                            selectedView === category.id
                              ? 'bg-foreground text-background border-2 border-black dark:border-white shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]'
                              : 'bg-transparent text-foreground border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`
                        : `pb-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            selectedView === category.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      {category.name}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Tags and Save Status - Right Side */}
              <div className="flex items-center gap-4">
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <span className="text-xs text-gray-400 font-medium">TAGS:</span>
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => scrollToTag(tag)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title={`Scroll to @${tag}`}
                      >
                        @{tag}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Save Status */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    Saving...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {/* Main Content Area */}
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Notes Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedView === 'all' 
                    ? 'All Notes' 
                    : categories.find(cat => cat.id === selectedView)?.name + ' Notes'
                  }
                </h2>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('bold')}
                    className="p-2"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('italic')}
                    className="p-2"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes Editor */}
            <div className="p-4">
              <textarea
                id="notes-editor"
                value={noteContent}
                onChange={handleContentChange}
                placeholder={`Start writing your ${
                  selectedView === 'all' ? 'notes' : categories.find(cat => cat.id === selectedView)?.name.toLowerCase() + ' notes'
                }...`}
                className="w-full h-[600px] p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 leading-relaxed"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              />
            </div>

            {/* Footer Info */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {noteContent.length} characters • {noteContent.split('\n').length} lines
                </span>
                <span>Auto-saved as you type</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;