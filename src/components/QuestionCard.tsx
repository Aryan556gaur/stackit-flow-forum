
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, MessageSquare, Eye, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Question {
  id: number;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
    reputation: number;
  };
  votes: number;
  answers: number;
  views: number;
  tags: string[];
  createdAt: Date;
  hasAcceptedAnswer?: boolean;
}

interface QuestionCardProps {
  question: Question;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Vote and Stats */}
        <div className="flex flex-col items-center space-y-2 text-sm text-gray-600 min-w-[80px]">
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{question.votes}</span>
            <span>votes</span>
          </div>
          
          <div className={`flex flex-col items-center ${question.hasAcceptedAnswer ? 'text-green-600' : ''}`}>
            <span className={`font-medium ${question.hasAcceptedAnswer ? 'text-green-700' : 'text-gray-900'}`}>
              {question.answers}
            </span>
            <span>answers</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{question.views}</span>
            <span>views</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-orange-600 transition-colors">
            <Link to={`/questions/${question.id}`}>
              {question.title}
            </Link>
          </h3>
          
          <p className="text-gray-600 mb-3 line-clamp-2">
            {question.excerpt}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {question.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Author and Time */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {question.views}
              </span>
              <span className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                {question.answers}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDistanceToNow(question.createdAt, { addSuffix: true })}
              </span>
              <span>by</span>
              <Link 
                to={`/users/${question.author.name}`}
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                {question.author.name}
              </Link>
              <span className="text-gray-400">({question.author.reputation})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
