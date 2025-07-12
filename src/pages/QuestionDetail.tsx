
import React from 'react';
import { useParams } from 'react-router-dom';
import QuestionHeader from '@/components/QuestionHeader';
import QuestionContent from '@/components/QuestionContent';
import AnswerCard from '@/components/AnswerCard';
import AnswerForm from '@/components/AnswerForm';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Question */}
      <div className="bg-white rounded-lg border p-6">
        <QuestionHeader
          title={mockQuestion.title}
          views={mockQuestion.views}
          createdAt={mockQuestion.createdAt}
          updatedAt={mockQuestion.updatedAt}
          tags={mockQuestion.tags}
        />
        
        <QuestionContent
          id={mockQuestion.id}
          description={mockQuestion.description}
          author={mockQuestion.author}
          votes={mockQuestion.votes}
          createdAt={mockQuestion.createdAt}
        />
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
          <AnswerCard key={answer.id} answer={answer} />
        ))}
      </div>

      {/* Add Answer */}
      <AnswerForm />
    </div>
  );
};

export default QuestionDetail;
