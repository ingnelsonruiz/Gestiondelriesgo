import { PageHeader } from '@/components/page-header';
import { AiSummaryForm } from './_components/ai-summary-form';

export default function AiInsightsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="AI Insights"
        description="Paste a report below to generate an executive summary and key recommendations using AI."
        className="text-center"
      />
      <AiSummaryForm />
    </div>
  );
}
