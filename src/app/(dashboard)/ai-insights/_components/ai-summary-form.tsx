'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateExecutiveSummary, type GenerateExecutiveSummaryOutput } from '@/ai/flows/executive-report-summary';
import { Bot, FileText, Wand2 } from 'lucide-react';

const formSchema = z.object({
  report: z.string().min(100, {
    message: 'Report must be at least 100 characters long.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function AiSummaryForm() {
  const [result, setResult] = useState<GenerateExecutiveSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateExecutiveSummary(values);
      setResult(output);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to generate AI summary. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Report Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your full report here..."
                        className="min-h-[200px] text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || result) && (
        <div className="mt-8">
            <Separator className="my-8" />
            <h2 className="text-2xl font-bold font-headline text-center mb-6">AI Generated Insights</h2>
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Key Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[95%]" />
                  </CardContent>
                </Card>
              </div>
            ) : result && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                     <FileText className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.summary}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Key Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.recommendations}</p>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      )}
    </>
  );
}
