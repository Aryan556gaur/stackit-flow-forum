
import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write your content...",
  minHeight = "200px"
}: RichTextEditorProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const emojis = ['😀', '😊', '😎', '🤔', '👍', '👎', '❤️', '🔥', '💡', '🎉', '😅', '🙂'];

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic' },
    { icon: Strikethrough, action: () => insertText('~~', '~~'), title: 'Strikethrough' },
    { icon: List, action: () => insertText('\n- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('\n1. '), title: 'Numbered List' },
    { icon: LinkIcon, action: () => insertText('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertText('![alt text](', ')'), title: 'Image' },
    { icon: AlignLeft, action: () => insertText('\n<div align="left">\n', '\n</div>\n'), title: 'Align Left' },
    { icon: AlignCenter, action: () => insertText('\n<div align="center">\n', '\n</div>\n'), title: 'Align Center' },
    { icon: AlignRight, action: () => insertText('\n<div align="right">\n', '\n</div>\n'), title: 'Align Right' },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={button.action}
            title={button.title}
            className="h-8 w-8 p-0"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}
        
        {/* Emoji Picker */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert Emoji"
            className="h-8 w-8 p-0"
          >
            <Smile className="w-4 h-4" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10 grid grid-cols-6 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 hover:bg-gray-100 rounded text-lg flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <Textarea
        id="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 resize-none focus:ring-0 focus:border-0 rounded-none"
        style={{ minHeight }}
      />
      
      {/* Preview hint */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
        <strong>Tip:</strong> Use **bold**, *italic*, ~~strikethrough~~, [links](url), and ![images](url) for formatting
      </div>
    </div>
  );
};

export default RichTextEditor;
