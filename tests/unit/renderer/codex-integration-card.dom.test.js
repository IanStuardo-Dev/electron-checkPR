const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;

const CodexIntegrationCard = require('../../../src/renderer/features/settings/presentation/components/CodexIntegrationCard').default;

describe('CodexIntegrationCard', () => {
  test('abre el modal de politicas avanzadas sin sobrecargar la card principal', async () => {
    const user = userEvent.setup();
    const onSaveApiKey = jest.fn();

    render(React.createElement(CodexIntegrationCard, {
      isReady: true,
      onChange: jest.fn(),
      onSaveApiKey,
      apiKeyNeedsSave: true,
      isSavingApiKey: false,
      apiKeySaveFeedback: null,
      config: {
        enabled: true,
        model: 'gpt-5.2-codex',
        analysisDepth: 'deep',
        maxFilesPerRun: 120,
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: 'codex-key',
        snapshotPolicy: {
          excludedPathPatterns: '.env\nnode_modules/**',
          strictMode: true,
        },
        prReview: {
          enabled: true,
          maxPullRequests: 4,
          selectionMode: 'mixed',
          analysisDepth: 'standard',
          promptDirectives: {
            focusAreas: 'auth',
            customInstructions: '',
          },
        },
        promptDirectives: {
          architectureReviewEnabled: true,
          architecturePattern: 'hexagonal',
          requiredPractices: '',
          forbiddenPractices: '',
          domainContext: '',
          customInstructions: '',
        },
      },
    }));

    expect(screen.getByText(/las reglas avanzadas quedan fuera de la vista principal/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /politicas avanzadas/i }));

    expect(screen.getByRole('dialog', { name: /politicas avanzadas de codex/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/focus areas para pr ai review/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/patron o estilo a validar/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(onSaveApiKey).toHaveBeenCalledTimes(1);
  });
});
