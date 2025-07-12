
import React, { useState } from 'react';
import { Filter, SortAsc, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionCard from '@/components/QuestionCard';

// Mock data
const mockQuestions = [
  {
    id: 1,
    title: "How to handle async/await in React useEffect hook?",
    excerpt: "I'm trying to fetch data in a useEffect hook using async/await, but I'm getting warnings about memory leaks. What's the proper way to handle this?",
    author: { name: "john_doe", reputation: 1250 },
    votes: 15,
    answers: 3,
    views: 142,
    tags: ["react", "javascript", "async-await", "useeffect"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    hasAcceptedAnswer: true
  },
  {
    id: 2,
    title: "Best practices for TypeScript with React components",
    excerpt: "I'm new to TypeScript and want to know the best practices for typing React components, props, and state. Should I use interfaces or types?",
    author: { name: "sarah_dev", reputation: 892 },
    votes: 8,
    answers: 2,
    views: 89,
    tags: ["typescript", "react", "best-practices"],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 3,
    title: "Why is my CSS Grid layout not working on mobile devices?",
    excerpt: "I have a CSS Grid layout that works perfectly on desktop but breaks on mobile. The grid items are overlapping and the responsive design isn't working as expected.",
    author: { name: "mike_css", reputation: 634 },
    votes: 12,
    answers: 5,
    views: 203,
    tags: ["css", "css-grid", "responsive-design", "mobile"],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    hasAcceptedAnswer: false
  },
  {
    id: 4,
    title: "Node.js Express middleware execution order",
    excerpt: "I'm confused about the order in which Express middleware functions are executed. Can someone explain the middleware stack and how next() works?",
    author: { name: "backend_guru", reputation: 2156 },
    votes: 22,
    answers: 7,
    views: 318,
    tags: ["nodejs", "express", "middleware"],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    hasAcceptedAnswer: true
  },
  {
    id: 5,
    title: "How to optimize React app performance?",
    excerpt: "My React application is becoming slow with large datasets. What are the best practices for optimizing performance? Should I use React.memo, useMemo, or useCallback?",
    author: { name: "performance_dev", reputation: 1789 },
    votes: 31,
    answers: 9,
    views: 456,
    tags: ["react", "performance", "optimization", "react-memo"],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    hasAcceptedAnswer: true
  }
];

const Questions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  const filteredQuestions = mockQuestions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'votes':
        return b.votes - a.votes;
      case 'answers':
        return b.answers - a.answers;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Questions</h1>
          <p className="mt-1 text-gray-600">{mockQuestions.length} questions</p>
        </div>
        
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <a href="/ask">Ask Question</a>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="votes">Most Votes</SelectItem>
              <SelectItem value="answers">Most Answers</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter */}
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questions</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="accepted">Has Accepted Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {sortedQuestions.length > 0 ? (
          sortedQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No questions found matching your search.</p>
            <Button className="mt-4 bg-orange-600 hover:bg-orange-700" asChild>
              <a href="/ask">Ask the first question</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questions;
