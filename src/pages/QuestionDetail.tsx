
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Eye, 
  Clock, 
  User, 
  CheckCircle, 
  MessageSquare, 
  Edit, 
  Flag,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import VotingButtons from '@/components/VotingButtons';
import RichTextEditor from '@/components/RichTextEditor';

// Mock data - in a real app, this would come from an API
const mockQuestion = {
  id: 1,
  title: "How to handle async/await in React useEffect hook?",
  description: `I'm trying to fetch data in a useEffect hook using async/await, but I'm getting warnings about memory leaks. Here's what I'm currently doing:

\`\`\`javascript
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);
\`\`\`

This gives me a warning about memory leaks. What's the proper way to handle this?

**What I've tried:**
- Using .then() instead of async/await
- Adding cleanup functions
- Using AbortController

**Expected behavior:**
Clean async data fetching without memory leak warnings.

**Actual behavior:**
Getting memory leak warnings in the console.`,
  author: { 
    name: "john_doe", 
    reputation: 1250,
    avatar: "/avatars/john.jpg",
    joinDate: new Date(2022, 0, 15)
  },
  votes: 15,
  views: 142,
  tags: ["react", "javascript", "async-await", "useeffect"],
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
};

const mockAnswers = [
  {
    id: 1,
    content: `The issue is that you can't make the useEffect callback function itself async. Instead, you should define an async function inside the useEffect and call it:

\`\`\`javascript
useEffect(() => {
  const fetchDataAsync = async () => {
    try {
      const data = await fetchData();
      setData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchDataAsync();
}, []);
\`\`\`

**Why this works:**
- The useEffect callback is not async
- The async function is called inside the effect
- You can handle errors properly with try/catch

**For cleanup and preventing memory leaks:**

\`\`\`javascript
useEffect(() => {
  let isMounted = true;

  const fetchDataAsync = async () => {
    try {
      const data = await fetchData();
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (isMounted) {
        console.error('Error fetching data:', error);
      }
    }
  };

  fetchDataAsync();

  return () => {
    isMounted = false;
  };
}, []);
\`\`\``,
    author: { 
      name: "react_expert", 
      reputation: 4521,
      avatar: "/avatars/expert.jpg"
    },
    votes: 23,
    isAccepted: true,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 2,
    content: `Another modern approach is to use AbortController for better cleanup:

\`\`\`javascript
useEffect(() => {
  const controller = new AbortController();

  const fetchDataAsync = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching data:', error);
      }
    }
  };

  fetchDataAsync();

  return () => {
    controller.abort();
  };
}, []);
\`\`\`

This approach actually cancels the HTTP request when the component unmounts, which is more efficient than just ignoring the result.`,
    author: { 
      name: "modern_dev", 
      reputation: 2890,
      avatar: "/avatars/modern.jpg"
    },
    votes: 12,
    isAccepted: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  }
];

const QuestionDetail = () => {
  const { id } = useParams();
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Question */}
      <div className="bg-white rounded-lg border p-6">
        {/* Question Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {mockQuestion.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {mockQuestion.views} views
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Asked {formatDistanceToNow(mockQuestion.createdAt, { addSuffix: true })}
            </span>
            <span className="flex items-center">
              <Edit className="w-4 h-4 mr-1" />
              Modified {formatDistanceToNow(mockQuestion.updatedAt, { addSuffix: true })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {mockQuestion.tags.map((tag) => (
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

        {/* Question Content */}
        <div className="flex gap-6">
          <VotingButtons
            initialVotes={mockQuestion.votes}
            size="lg"
          />
          
          <div className="flex-1">
            <div className="prose max-w-none mb-6">
              <div className="whitespace-pre-wrap">{mockQuestion.description}</div>
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
                  asked {formatDistanceToNow(mockQuestion.createdAt, { addSuffix: true })}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <Link 
                      to={`/users/${mockQuestion.author.name}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {mockQuestion.author.name}
                    </Link>
                    <div className="text-xs text-gray-600">
                      {mockQuestion.author.reputation} reputation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {mockAnswers.length} {mockAnswers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
      </div>

      {/* Answers */}
      <div className="space-y-6">
        {mockAnswers.map((answer) => (
          <div key={answer.id} className="bg-white rounded-lg border p-6">
            <div className="flex gap-6">
              <VotingButtons
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
        ))}
      </div>

      {/* Add Answer */}
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
    </div>
  );
};

export default QuestionDetail;
