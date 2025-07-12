
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestionHeaderProps {
  title: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

const QuestionHeader = ({ title, views, createdAt, updatedAt, tags }: QuestionHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      
      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
        <span className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {views} views
        </span>
        <span className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          Asked {formatDistanceToNow(createdAt, { addSuffix: true })}
        </span>
        <span className="flex items-center">
          <Edit className="w-4 h-4 mr-1" />
          Modified {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default QuestionHeader;
