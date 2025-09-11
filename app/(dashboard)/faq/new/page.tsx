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
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { vkgApiService } from '@/lib/vkg-api';
import { InfoIcon, Sparkles, Save, Wand2, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '@/context/GlobalContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const departments = ['Claims', 'Policy', 'General'];

export default function NewQuestionPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [enableRouting, setEnableRouting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [requirement, setRequirement] = useState('');
  const [gatherRequirements, setGatherRequirements] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed } = useApp();

  const handleCancel = () => {
    router.push('/faq');
  };

  const handleBack = () => {
    router.back();
  };

  // AI Verification function
  const verifyWithAI = async (question: string, answer: string) => {
    try {
      setIsVerifying(true);
      const response = await fetch('/api/verify-faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          how_to_answer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result = await response.json();
      setAiVerificationResult(result);
      return result;
    } catch (error) {
      console.error('AI verification error:', error);
      toast({
        title: 'Verification Error',
        description: 'Failed to verify FAQ with AI. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  // Create FAQ mutation
  const createFaqMutation = useMutation({
    mutationFn: async (data: {
      main_question: string;
      how_to_answer_question: string;
      routing_status: boolean;
      knowledge_id: string;
      company_name: string;
      status_ai_approval: boolean;
      department: string;
      requirement_gathering?: string;
      how_to_gather_requirement?: string;
    }) => {
      return vkgApiService.insertQuestion(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate FAQs query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast({
          title: 'Success',
          description: 'Your new question has been successfully created.',
        });
        router.push('/faq');
      } else {
        throw new Error(response.message || 'Failed to create FAQ');
      }
    },
    onError: (error: any) => {
      console.error('Failed to create FAQ:', error);
      toast({
        title: 'Error',
        description: 'We apologize, but your question cannot be saved at the moment. Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = async () => {
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

    // First, verify with AI
    const verificationResult = await verifyWithAI(question, answer);

    if (!verificationResult) {
      // Verification failed, don't proceed with saving
      return;
    }

    if (verificationResult.status === 'Approved') {
      // AI approved, proceed with saving
      proceedWithSaving();
    } else if (verificationResult.status === 'Not Approved') {
      // AI not approved, show suggestions
      setShowAISuggestions(true);
    }
  };

  const proceedWithSaving = () => {
    const insertData = {
      main_question: question,
      how_to_answer_question: answer,
      routing_status: enableRouting,
      knowledge_id: 'document_0', // Using default knowledge_id
      company_name: 'Claire Insurance', // Default company name
      status_ai_approval: true, // Default to approved
      department: selectedDepartment || 'General',
      requirement_gathering: enableRouting ? requirement : undefined,
      how_to_gather_requirement: enableRouting ? gatherRequirements : undefined,
    };

    createFaqMutation.mutate(insertData);
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
  };

  const handleRequirementChange = (value: string) => {
    setRequirement(value);
    // Reset gather requirements when requirement field is cleared
    if (!value.trim()) {
      setGatherRequirements('');
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    // Reset requirement and gather requirements when department is changed or cleared
    if (!value) {
      setRequirement('');
      setGatherRequirements('');
    }
  };

  const handleApplyAIChange = () => {
    if (aiVerificationResult?.best_answer) {
      setAnswer(aiVerificationResult.best_answer);
    }
    if (aiVerificationResult?.Question) {
      setQuestion(aiVerificationResult.Question);
    }
    setShowAISuggestions(false);
    setAiVerificationResult(null);
    setIsManualEditing(false); // Reset manual editing when applying AI changes
  };

  const handleSaveAnyway = () => {
    // Keep current answer as is and proceed with saving
    setShowAISuggestions(false);
    setAiVerificationResult(null);
    setIsManualEditing(false); // Reset manual editing when saving anyway
    proceedWithSaving();
  };

  const handleCloseAISuggestions = () => {
    setShowAISuggestions(false);
    setIsManualEditing(false); // Reset manual editing when closing AI suggestions
  };

  const handleViewAISuggestions = () => {
    setShowErrorPopup(false);
    setShowAISuggestions(true);
  };

  return (
    <div className="relative">
      <div className="content-area">
        <PageHeader
          title="Add New Question"
          subtitle="Create a new FAQ for the knowledge base"
          showBackButton={true}
          onBackClick={handleBack}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Add New Question</CardTitle>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createFaqMutation.isPending || isVerifying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : createFaqMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Save Question'
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 w-1/2">
            <div className="space-y-2">
              <Label htmlFor="question" className="text-sm font-medium">
                Question <span className="text-red-500">*</span>
              </Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Type the FAQ question here..."
                disabled={showAISuggestions && !isManualEditing}
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
                placeholder="Provide a detailed answer..."
                className="min-h-[120px] resize-none"
                disabled={showAISuggestions && !isManualEditing}
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
                    disabled={showAISuggestions && !isManualEditing}
                  />
                </div>

                {enableRouting && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">
                        Department
                      </Label>
                      <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={showAISuggestions && !isManualEditing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
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

                    {selectedDepartment && (
                      <div className="space-y-2">
                        <Label htmlFor="requirement" className="text-sm font-medium">
                          Requirement to confirm before routing (Optional)
                        </Label>
                        <Textarea
                          id="requirement"
                          value={requirement}
                          onChange={(e) => handleRequirementChange(e.target.value)}
                          placeholder="Write here"
                          className="min-h-[100px] resize-none"
                          disabled={showAISuggestions && !isManualEditing}
                        />
                      </div>
                    )}

                    {requirement.trim() && (
                      <div className="space-y-2">
                        <Label htmlFor="gather-requirements" className="text-sm font-medium">
                          How to gather requirements
                        </Label>
                        <Textarea
                          id="gather-requirements"
                          value={gatherRequirements}
                          onChange={(e) => setGatherRequirements(e.target.value)}
                          className="min-h-[100px] resize-none"
                          disabled={showAISuggestions && !isManualEditing}
                        />
                      </div>
                    )}
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

            {showAISuggestions && !isManualEditing && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setIsManualEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Changes Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Popup Modal */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorPopup(false)}
              className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Orange Warning Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">!</span>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Oops!!</h2>
            
            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              It looks like there's a problem with your Answer.<br />
              Please try rephrasing your question and we'll get you the<br />
              right answer in no time.
            </p>
            
            {/* View AI Suggestions Button */}
            <Button 
              onClick={handleViewAISuggestions}
              className="w-full bg-orange-400 hover:bg-orange-500 text-white py-3 rounded-lg font-medium"
            >
              View AI Suggestions
            </Button>
          </div>
        </div>
      )}

      {/* AI Suggestions Drawer Overlay */}
      {showAISuggestions && (
        <div
          className={`fixed top-0 right-0 rounded-l-lg h-screen bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
            showAISuggestions ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            width: `calc((100vw - ${isSidebarCollapsed ? '80px' : '356px'}) / 2)`
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-[#111827]">AI Suggestions</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseAISuggestions}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* AI Suggestions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">AI Suggestions</h3>

                {aiVerificationResult?.suggestions && (
                  <div className="space-y-3">
                    {Object.entries(aiVerificationResult.suggestions).map(([key, suggestion], index) => (
                      <div key={key} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            Suggestion {index + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {String(suggestion)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Question */}
                {aiVerificationResult?.Question && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">Suggested Question</h4>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {aiVerificationResult.Question}
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggested Answer */}
                {aiVerificationResult?.best_answer && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">Suggested Answer</h4>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {aiVerificationResult.best_answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSaveAnyway} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Anyway
                </Button>
                <Button onClick={handleApplyAIChange} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Apply AI Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
