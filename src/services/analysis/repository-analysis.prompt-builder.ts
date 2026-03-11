import type { RepositoryAnalysisPromptDirectives, RepositoryAnalysisRequest, RepositorySnapshot } from '../../types/analysis';
import type { AnalysisPromptBuilderPort, AnalysisPromptPayload } from './repository-analysis.ports';

function buildPromptDirectiveSection(promptDirectives?: RepositoryAnalysisPromptDirectives): string {
  if (!promptDirectives) {
    return '';
  }

  const sections: string[] = [];

  if (promptDirectives.architectureReviewEnabled) {
    sections.push('Architecture review is explicitly required.');
  }

  if (promptDirectives.architecturePattern) {
    sections.push(`The repository should be evaluated against this architecture or design style: ${promptDirectives.architecturePattern}.`);
  }

  if (promptDirectives.requiredPractices) {
    sections.push(`Required practices to verify:\n${promptDirectives.requiredPractices}`);
  }

  if (promptDirectives.forbiddenPractices) {
    sections.push(`Practices or anti-patterns that must be flagged:\n${promptDirectives.forbiddenPractices}`);
  }

  if (promptDirectives.domainContext) {
    sections.push(`Domain context for the analysis:\n${promptDirectives.domainContext}`);
  }

  if (promptDirectives.customInstructions) {
    sections.push(`Additional reviewer instructions:\n${promptDirectives.customInstructions}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `Analysis policies configured by the user:\n${sections.join('\n\n')}`;
}

export class RepositoryAnalysisPromptBuilder implements AnalysisPromptBuilderPort {
  build(request: RepositoryAnalysisRequest, snapshot: RepositorySnapshot): AnalysisPromptPayload {
    const systemPrompt = [
      'You are a senior staff engineer performing repository analysis for maintainability, security, architecture, performance and testing.',
      'Return concise, actionable findings only.',
      'Base the analysis strictly on the provided repository snapshot.',
      'Prefer high-signal issues over exhaustive low-value nitpicks.',
      'Respond in Spanish.',
      'All fields in the structured output must be written in Spanish, including summary, concerns, recommendations, titles and details.',
    ].join(' ');

    const userPrompt = [
      `Provider: ${snapshot.provider}`,
      `Repository: ${snapshot.repository}`,
      `Branch: ${snapshot.branch}`,
      `Files analyzed: ${snapshot.files.length}/${snapshot.totalFilesDiscovered}`,
      `Analysis depth: ${request.analysisDepth}`,
      buildPromptDirectiveSection(request.promptDirectives),
      '',
      'Repository snapshot:',
      snapshot.files.map((file) => (
        `FILE: ${file.path}\nSIZE: ${file.size}\nCONTENT:\n${file.content.slice(0, 12000)}`
      )).join('\n\n---\n\n'),
    ].join('\n');

    return {
      systemPrompt,
      userPrompt,
    };
  }
}
