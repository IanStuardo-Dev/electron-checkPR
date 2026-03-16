const { selectPullRequestsForAiReview } = require('../../../src/shared/pull-request-selection');
const {
  isTestFile,
  isSupportedCodeFile,
  rankPath,
  mergeExcludedPathPatterns,
  parseExcludedPathPatterns,
  shouldExcludeSnapshotPath,
} = require('../../../src/services/shared/repository-snapshot-helpers');

function createPullRequest(id, riskScore, ageHours) {
  return {
    id,
    riskScore,
    ageHours,
  };
}

describe('shared selection and snapshot helpers', () => {
  test('shared pull-request selection cubre top-risk, oldest y mixed', () => {
    const sample = [
      createPullRequest(1, 10, 10),
      createPullRequest(2, 8, 30),
      createPullRequest(3, 4, 50),
      createPullRequest(4, 2, 70),
    ];

    expect(selectPullRequestsForAiReview(sample, 'top-risk', 2).map((item) => item.id)).toEqual([1, 2]);
    expect(selectPullRequestsForAiReview(sample, 'oldest', 2).map((item) => item.id)).toEqual([4, 3]);
    expect(selectPullRequestsForAiReview(sample, 'mixed', 3).map((item) => item.id)).toEqual([1, 4, 2]);
    expect(selectPullRequestsForAiReview(sample, 'top-risk', 0)).toHaveLength(1);
  });

  test('snapshot helpers clasifican archivos, prioridad y exclusiones', () => {
    expect(isTestFile('src/__tests__/auth.spec.ts')).toBe(true);
    expect(isTestFile('src/auth.ts')).toBe(false);
    expect(isSupportedCodeFile('src/app.ts')).toBe(true);
    expect(isSupportedCodeFile('assets/logo.png')).toBe(false);

    expect(rankPath('src/auth/token.ts')).toBe(4);
    expect(rankPath('src/server/app.ts')).toBe(3);
    expect(rankPath('infra/deploy.yaml')).toBe(2);
    expect(rankPath('docs/readme.md')).toBe(1);

    expect(parseExcludedPathPatterns('.env\n dist/** \n')).toEqual(['.env', 'dist/**']);
    expect(mergeExcludedPathPatterns('.env', 'dist/**', '.env')).toBe('.env\ndist/**');
    expect(shouldExcludeSnapshotPath('.env', '.env\n*.pem')).toBe(true);
    expect(shouldExcludeSnapshotPath('src/app.ts', '.env\n*.pem')).toBe(false);
  });
});
