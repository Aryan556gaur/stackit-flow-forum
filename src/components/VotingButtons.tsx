
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VotingButtonsProps {
  initialVotes: number;
  userVote?: 'up' | 'down' | null;
  onVote?: (voteType: 'up' | 'down') => void;
  size?: 'sm' | 'md' | 'lg';
}

const VotingButtons = ({ 
  initialVotes, 
  userVote = null, 
  onVote,
  size = 'md'
}: VotingButtonsProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(userVote);

  const handleVote = (voteType: 'up' | 'down') => {
    let newVotes = votes;
    let newCurrentVote: 'up' | 'down' | null = voteType;

    // Remove previous vote if it exists
    if (currentVote === 'up') {
      newVotes -= 1;
    } else if (currentVote === 'down') {
      newVotes += 1;
    }

    // If clicking the same vote type, remove the vote
    if (currentVote === voteType) {
      newCurrentVote = null;
    } else {
      // Add new vote
      if (voteType === 'up') {
        newVotes += 1;
      } else {
        newVotes -= 1;
      }
    }

    setVotes(newVotes);
    setCurrentVote(newCurrentVote);
    
    if (onVote) {
      onVote(voteType);
    }
  };

  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        className={`${buttonSize} p-0 ${
          currentVote === 'up' 
            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
            : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
        }`}
      >
        <ChevronUp className={iconSize} />
      </Button>
      
      <span className={`font-semibold ${textSize} ${
        votes > 0 ? 'text-green-600' : votes < 0 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {votes}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        className={`${buttonSize} p-0 ${
          currentVote === 'down' 
            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
};

export default VotingButtons;
