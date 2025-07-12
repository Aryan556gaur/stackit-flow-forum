
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VotingButtonsProps {
  targetId: number;
  targetType: 'question' | 'answer';
  initialVotes: number;
  userVote?: 'up' | 'down' | null;
  onVoteChange?: (newVotes: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const VotingButtons = ({ 
  targetId,
  targetType,
  initialVotes, 
  userVote = null, 
  onVoteChange,
  size = 'md'
}: VotingButtonsProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(userVote);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      let response;
      
      // If clicking the same vote type, remove the vote
      if (currentVote === voteType) {
        response = await apiService.removeVote(targetId, targetType);
        if (response.success) {
          const voteChange = voteType === 'up' ? -1 : 1;
          const newVotes = votes + voteChange;
          setVotes(newVotes);
          setCurrentVote(null);
          onVoteChange?.(newVotes);
        }
      } else {
        response = await apiService.vote(targetId, targetType, voteType);
        if (response.success) {
          let newVotes = votes;
          
          // Remove previous vote if it exists
          if (currentVote === 'up') {
            newVotes -= 1;
          } else if (currentVote === 'down') {
            newVotes += 1;
          }
          
          // Add new vote
          if (voteType === 'up') {
            newVotes += 1;
          } else {
            newVotes -= 1;
          }
          
          setVotes(newVotes);
          setCurrentVote(voteType);
          onVoteChange?.(newVotes);
        }
      }
      
      if (!response.success) {
        toast({
          title: "Vote failed",
          description: response.error || "Failed to register vote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Vote error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
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
        disabled={isLoading}
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
