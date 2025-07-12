
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, SortAsc, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionCard from '@/components/QuestionCard';
import { apiService } from '@/services/api';
import { Question } from '@/types/database';

const Questions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: questionsResponse, isLoading, error } = useQuery({
    queryKey: ['questions', currentPage, sortBy, searchTerm],
    queryFn: () => apiService.getQuestions({
      page: currentPage,
      limit: 10,
      sort: sortBy,
      search: searchTerm || undefined,
    }),
  });

  const questions = questionsResponse?.data?.data || [];
  const pagination = questionsResponse?.data?.pagination;

  const filteredQuestions = questions.filter((question: Question) => {
    switch (filterBy) {
      case 'unanswered':
        return question.answers === 0;
      case 'answered':
        return question.answers > 0;
      case 'accepted':
        return question.has_accepted_answer;
      default:
        return true;
    }
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Failed to load questions. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Questions</h1>
          <p className="mt-1 text-gray-600">
            {isLoading ? 'Loading...' : `${pagination?.total || 0} questions`}
          </p>
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
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading questions...</p>
          </div>
        ) : filteredQuestions.length > 0 ? (
          <>
            {filteredQuestions.map((question: Question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
            
            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center space-x-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                  disabled={currentPage === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
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
