
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { User, Edit, Flag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VotingButtons from '@/components/VotingButtons';

interface Author {
  name: string;
  reputation: number;
  avatar: string;
  joinDate: Date;
}

interface QuestionContentProps {
  id: number;
  description: string;
  author: Author;
  votes: number;
  createdAt: Date;
}

const QuestionContent = ({ id, description, author, votes, createdAt }: QuestionContentProps) => {
  return (
    <div className="flex gap-6">
      <VotingButtons
        targetId={id}
        targetType="question"
        initialVotes={votes}
        size="lg"
      />
      
      <div className="flex-1">
        <div className="prose max-w-none mb-6">
          <div className="whitespace-pre-wrap">{description}</div>
        </div>
        
        {/* Question Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="sm">
              <Flag className="w-4 h-4 mr-1" />
              Flag
            </Button>
          </div>
          
          {/* Author Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">
              asked {formatDistanceToNow(createdAt, { addSuffix: true })}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <Link 
                  to={`/users/${author.name}`}
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  {author.name}
                </Link>
                <div className="text-xs text-gray-600">
                  {author.reputation} reputation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionContent;
