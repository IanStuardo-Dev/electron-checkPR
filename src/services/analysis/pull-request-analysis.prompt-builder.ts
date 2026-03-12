import type { PullRequestAnalysisBatchRequest, PullRequestSnapshot } from '../../types/analysis';

function buildPromptDirectiveSection(promptDirectives?: PullRequestAnalysisBatchRequest['promptDirectives']): string {
  if (!promptDirectives) {
    return '';
  }

  const sections: string[] = [];

  if (promptDirectives.focusAreas.trim()) {
    sections.push(`Focus areas that must be prioritized:\n${promptDirectives.focusAreas.trim()}`);
  }

  if (promptDirectives.customInstructions.trim()) {
    sections.push(`Additional reviewer instructions:\n${promptDirectives.customInstructions.trim()}`);
  }

  return sections.length > 0 ? `PR AI review directives:\n${sections.join('\n\n')}` : '';
}

export class PullRequestAnalysisPromptBuilder {
  build(
    request: PullRequestAnalysisBatchRequest,
    snapshot: PullRequestSnapshot,
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = [
      'You are a senior staff engineer reviewing a Pull Request for delivery risk, architecture, security, maintainability and reviewer guidance.',
      'Respond in Spanish.',
      'Focus on prioritization and reviewer value, not exhaustive lint-level comments.',
      'Output must be JSON with fields: riskScore, shortSummary, topConcerns, reviewChecklist.',
    ].join(' ');

    const userPrompt = [
      `Provider: ${snapshot.provider}`,
      `Repository: ${snapshot.repository}`,
      `PR: #${snapshot.pullRequestId}`,
      `Title: ${snapshot.title}`,
      `Description: ${snapshot.description}`,
      `Author: ${snapshot.author}`,
      `Branches: ${snapshot.sourceBranch} -> ${snapshot.targetBranch}`,
      `Reviewers: ${snapshot.reviewers.map((reviewer) => `${reviewer.displayName}(${reviewer.vote})`).join(', ') || 'none'}`,
      `Files changed: ${snapshot.files.length}/${snapshot.totalFilesChanged}`,
      `Analysis depth: ${request.analysisDepth}`,
      snapshot.partialReason ? `Snapshot note: ${snapshot.partialReason}` : '',
      buildPromptDirectiveSection(request.promptDirectives),
      '',
      'Changed files:',
      snapshot.files.map((file) => [
        `FILE: ${file.path}`,
        `STATUS: ${file.status}`,
        typeof file.additions === 'number' ? `ADDITIONS: ${file.additions}` : '',
        typeof file.deletions === 'number' ? `DELETIONS: ${file.deletions}` : '',
        file.patch ? `PATCH:\n${file.patch.slice(0, 6000)}` : '',
      ].filter(Boolean).join('\n')).join('\n\n---\n\n'),
    ].filter(Boolean).join('\n');

    return {
      systemPrompt,
      userPrompt,
    };
  }
}
