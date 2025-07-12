
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';

const AnswerForm = () => {
  const [newAnswer, setNewAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnswer.trim()) {
      // Here you would submit the answer to your backend
      console.log('Submitting answer:', newAnswer);
      setNewAnswer('');
      setIsAnswering(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Your Answer</h3>
      
      {!isAnswering ? (
        <Button 
          onClick={() => setIsAnswering(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Write an Answer
        </Button>
      ) : (
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <RichTextEditor
            value={newAnswer}
            onChange={setNewAnswer}
            placeholder="Write your answer here..."
            minHeight="200px"
          />
          
          <div className="flex items-center gap-2">
            <Button 
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!newAnswer.trim()}
            >
              Post Your Answer
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setIsAnswering(false);
                setNewAnswer('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AnswerForm;
