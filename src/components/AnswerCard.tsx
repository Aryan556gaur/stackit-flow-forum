
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { User, CheckCircle, Edit, Flag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VotingButtons from '@/components/VotingButtons';

interface Author {
  name: string;
  reputation: number;
  avatar: string;
}

interface Answer {
  id: number;
  content: string;
  author: Author;
  votes: number;
  isAccepted: boolean;
  createdAt: Date;
}

interface AnswerCardProps {
  answer: Answer;
}

const AnswerCard = ({ answer }: AnswerCardProps) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex gap-6">
        <VotingButtons
          targetId={answer.id}
          targetType="answer"
          initialVotes={answer.votes}
          size="lg"
        />
        
        <div className="flex-1">
          {answer.isAccepted && (
            <div className="flex items-center mb-4 text-green-600">
              <CheckCircle className="w-5 h-5 mr-2 fill-current" />
              <span className="font-medium">Accepted Answer</span>
            </div>
          )}
          
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap">{answer.content}</div>
          </div>
          
          {/* Answer Actions */}
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
            
            {/* Answer Author */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">
                answered {formatDistanceToNow(answer.createdAt, { addSuffix: true })}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <Link 
                    to={`/users/${answer.author.name}`}
                    className="font-medium text-orange-600 hover:text-orange-700"
                  >
                    {answer.author.name}
                  </Link>
                  <div className="text-xs text-gray-600">
                    {answer.author.reputation} reputation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
