const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;

const GlobalSnapshotPolicyCard = require('../../../src/renderer/features/settings/presentation/components/GlobalSnapshotPolicyCard').default;
const { applySnapshotPreset } = require('../../../src/renderer/features/settings/presentation/components/GlobalSnapshotPolicyCard');

describe('GlobalSnapshotPolicyCard', () => {
  test('applySnapshotPreset node reemplaza la base con exclusiones recomendadas', () => {
    const next = applySnapshotPreset({
      excludedPathPatterns: 'custom/**',
      strictMode: false,
    }, 'node');

    expect(next.strictMode).toBe(false);
    expect(next.excludedPathPatterns).toMatch(/node_modules\/\*\*/);
    expect(next.excludedPathPatterns).toMatch(/coverage\/\*\*/);
    expect(next.excludedPathPatterns).toMatch(/\.npmrc/);
  });

  test('permite aplicar preset node desde la UI', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(React.createElement(GlobalSnapshotPolicyCard, {
      snapshotPolicy: {
        excludedPathPatterns: 'custom/**',
        strictMode: true,
      },
      onChange,
    }));

    await user.click(screen.getByRole('button', { name: /editar reglas/i }));
    await user.click(screen.getByRole('button', { name: /aplicar preset node/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      strictMode: true,
      excludedPathPatterns: expect.stringMatching(/node_modules\/\*\*/),
    }));
  });
});
