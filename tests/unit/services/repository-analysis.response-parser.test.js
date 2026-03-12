const { RepositoryAnalysisResponseParser } = require('../../../src/services/analysis/repository-analysis.response-parser');

describe('RepositoryAnalysisResponseParser', () => {
  const parser = new RepositoryAnalysisResponseParser();

  test('parsea payload estructurado directo', () => {
    const parsed = parser.parse(JSON.stringify({
      summary: 'ok',
      score: 80,
      riskLevel: 'medium',
      topConcerns: ['a'],
      recommendations: ['b'],
      findings: [{
        id: '1',
        title: 'hallazgo',
        severity: 'high',
        category: 'security',
        filePath: 'src/app.ts',
        detail: 'detalle',
        recommendation: 'reco',
      }],
    }));

    expect(parsed.score).toBe(80);
    expect(parsed.findings).toHaveLength(1);
  });

  test('parsea desde output_text y desde output content', () => {
    const fromOutputText = parser.parse(JSON.stringify({
      output_text: JSON.stringify({
        summary: 'output_text',
        score: 50,
        riskLevel: 'low',
        topConcerns: [],
        recommendations: [],
        findings: [],
      }),
    }));

    expect(fromOutputText.summary).toBe('output_text');

    const fromOutputContent = parser.parse(JSON.stringify({
      output: [{
        content: [{
          text: JSON.stringify({
            summary: 'content',
            score: 60,
            riskLevel: 'medium',
            topConcerns: ['x'],
            recommendations: ['y'],
            findings: [],
          }),
        }],
      }],
    }));

    expect(fromOutputContent.summary).toBe('content');
  });

  test('expone debug cuando no hay estructura valida', () => {
    expect(() => parser.parse(JSON.stringify({
      output: [{ content: [{ text: 'texto libre no json' }] }],
    }))).toThrow(/Raw response/i);
  });

  test('falla si la respuesta no es json', () => {
    expect(() => parser.parse('invalid')).toThrow(/respuesta invalida/i);
  });
});
