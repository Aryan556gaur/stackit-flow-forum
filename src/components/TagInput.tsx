
import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagInput = ({ 
  tags, 
  onChange, 
  placeholder = "Add tags...",
  maxTags = 5 
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions] = useState([
    'javascript', 'react', 'typescript', 'nodejs', 'python', 'html', 'css',
    'angular', 'vue', 'express', 'mongodb', 'sql', 'git', 'docker',
    'aws', 'firebase', 'graphql', 'redux', 'nextjs', 'tailwind'
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="min-h-[42px] p-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-2 py-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-orange-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {tags.length < maxTags && (
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="border-0 shadow-none focus:ring-0 p-0 h-auto flex-1 min-w-[120px]"
            />
          )}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredSuggestions.slice(0, 10).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
        <span>Press Enter or Tab to add tags</span>
        <span>{tags.length}/{maxTags} tags</span>
      </div>
    </div>
  );
};

export default TagInput;
