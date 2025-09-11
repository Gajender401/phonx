'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { vkgApiService, transformVKGToFAQ } from '@/lib/vkg-api';
import { InfoIcon, Sparkles, Save, Wand2, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const departments = ['Claims', 'Policy', 'General'];

interface FAQData {
  id: string;
  question: string;
  answer: string;
  department: string;
  routing_status: boolean;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
}

export default function EditQuestionPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [enableRouting, setEnableRouting] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('Claims');
  const [requirement, setRequirement] = useState('');
  const [gatherRequirements, setGatherRequirements] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed, isAuthenticated, authLoading } = useApp();

  // Fetch all FAQs to find the specific one
  const { data: allFAQs = [], isLoading, error } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const response = await vkgApiService.getAllQuestions('document_0');
      return transformVKGToFAQ(response);
    },
    enabled: !authLoading && isAuthenticated,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });

  // Find the specific FAQ from the fetched data
  const faqData = allFAQs.find(faq => faq.id === id);

  // Show error if no FAQs found or specific FAQ not found
  const faqNotFound = !isLoading && allFAQs.length > 0 && !faqData;
  const noFAQsAtAll = !isLoading && allFAQs.length === 0 && !error;

  // Update FAQ mutation
  const updateFaqMutation = useMutation({
    mutationFn: async (data: {
      main_question: string;
      how_to_answer_question: string;
      routing_status: boolean;
      doc_id: string;
      chunk_index: string;
      department: string;
      requirement_gathering?: string;
      how_to_gather_requirement?: string;
    }) => {
      return vkgApiService.updateQuestion(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate FAQs query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast({
          title: 'Success',
          description: 'FAQ updated successfully.',
        });
        router.push('/faq');
      } else {
        throw new Error(response.message || 'Failed to update FAQ');
      }
    },
    onError: (error: any) => {
      console.error('Failed to update FAQ:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update FAQ. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Set form data when FAQ data is loaded
  React.useEffect(() => {
    if (faqData) {
      setQuestion(faqData.question);
      setAnswer(faqData.answer);
      setSelectedDepartment(faqData.department);
      setEnableRouting(faqData.routing_status);
      setRequirement(faqData.requirement_gathering || '');
      setGatherRequirements(faqData.how_to_gather_requirement || '');
    }
  }, [faqData]);

  const handleCancel = () => {
    router.push('/faq');
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both question and answer fields.',
        variant: 'destructive',
      });
      return;
    }

    if (enableRouting && requirement.trim() && !gatherRequirements.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide how to gather requirements when routing is enabled.',
        variant: 'destructive',
      });
      return;
    }

    const updateData = {
      main_question: question,
      how_to_answer_question: answer,
      routing_status: enableRouting,
      doc_id: 'document_0', // Using default knowledge_id
      chunk_index: id,
      department: selectedDepartment || 'General',
      requirement_gathering: enableRouting ? requirement : undefined,
      how_to_gather_requirement: enableRouting ? gatherRequirements : undefined,
    };

    updateFaqMutation.mutate(updateData);
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to edit FAQs.</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading FAQ...</p>
        </div>
      </div>
    );
  }

  // Show error if FAQ not found or fetch failed
  if (error || faqNotFound || noFAQsAtAll) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>
            {error instanceof Error
              ? error.message
              : faqNotFound
                ? `FAQ with ID "${id}" not found`
                : noFAQsAtAll
                  ? 'No FAQs available'
                  : 'FAQ not found'
            }
          </p>
          <button
            onClick={() => router.push('/faq')}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Back to FAQs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <PageHeader
        title="Edit Question"
        subtitle="Update the FAQ question and answer"
        showBackButton={true}
        onBackClick={handleBack}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Edit Question</CardTitle>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateFaqMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateFaqMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Question'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">
              Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer" className="text-sm font-medium">
              How to Answer <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <Card className="bg-[#F2FAFF] border-[#96B1CE66]">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-routing" className="text-sm font-medium">
                  Enable Routing
                </Label>
                <Switch
                  id="enable-routing"
                  checked={enableRouting}
                  onCheckedChange={setEnableRouting}
                />
              </div>

              {enableRouting && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">
                      Department
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirement" className="text-sm font-medium">
                      Requirement to confirm before routing (Optional)
                    </Label>
                    <Textarea
                      id="requirement"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder="Write here"
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gather-requirements" className="text-sm font-medium">
                      How to gather requirements
                    </Label>
                    <Textarea
                      id="gather-requirements"
                      value={gatherRequirements}
                      onChange={(e) => setGatherRequirements(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  You can also create question without routing
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
