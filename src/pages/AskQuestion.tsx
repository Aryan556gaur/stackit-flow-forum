import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import RichTextEditor from '@/components/RichTextEditor';
import TagInput from '@/components/TagInput';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AskQuestion = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to ask a question",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 15) {
      newErrors.title = 'Title must be at least 15 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 30) {
      newErrors.description = 'Description must be at least 30 characters';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiService.createQuestion({
        title: formData.title,
        content: formData.description,
        tags: formData.tags,
      });
      
      if (response.success && response.data) {
        toast({
          title: "Question posted!",
          description: "Your question has been posted successfully.",
        });
        navigate(`/questions/${response.data.id}`);
      } else {
        toast({
          title: "Failed to post question",
          description: response.error || "An error occurred while posting your question",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ask a Question</h1>
        <p className="mt-2 text-gray-600">
          Get help from the community by asking a clear, detailed question.
        </p>
      </div>

      {/* Tips Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Writing a good question</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Summarize your problem in a one-line title</li>
              <li>• Describe your problem in detail</li>
              <li>• Describe what you tried and what you expected to happen</li>
              <li>• Add relevant tags to help others find your question</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            Title <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Be specific and imagine you're asking a question to another person.
          </p>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. How do I use async/await in React useEffect?"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.title}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Description <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Include all the information someone would need to answer your question.
          </p>
          <div className={errors.description ? 'border border-red-500 rounded-lg' : ''}>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe your problem in detail. Include what you've tried, what you expected to happen, and what actually happened..."
              minHeight="300px"
            />
          </div>
          {errors.description && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.description}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Tags <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            Add up to 5 tags to describe what your question is about.
          </p>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="e.g. react, javascript, async-await"
          />
          {errors.tags && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.tags}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit"
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Your Question'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AskQuestion;
