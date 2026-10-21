import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateLexicalStressExtended,
  analyzeDomainResponses
} from '../src/data/datasets.js';

describe('Clinical Accuracy & Lexical Sentiment Pipeline', () => {
  it('correctly scores everyday depressive and anxiety vocabulary as elevated distress', () => {
    const distressedText = "I have been feeling deeply sad and depressed, work has been so stressful and I have insomnia.";
    const score = calculateLexicalStressExtended(distressedText);
    assert.ok(score >= 0.55, `Expected elevated distress score, got ${score}`);
  });

  it('correctly scores euthymic resilience and calm statements as minimal distress', () => {
    const calmText = "I have been sleeping soundly, feeling peaceful and energetic, and doing great with friends.";
    const score = calculateLexicalStressExtended(calmText);
    assert.ok(score <= 0.20, `Expected minimal distress score, got ${score}`);
  });

  it('handles negative negation: suppresses false distress when terms are negated', () => {
    const negatedDistress = "I am not sad, not depressed, and have zero stress.";
    const unnegatedDistress = "I am sad, depressed, and have stress.";
    const negatedScore = calculateLexicalStressExtended(negatedDistress);
    const unnegatedScore = calculateLexicalStressExtended(unnegatedDistress);
    assert.ok(
      negatedScore < unnegatedScore,
      `Negated score (${negatedScore}) should be strictly lower than unnegated (${unnegatedScore})`
    );
    assert.ok(negatedScore <= 0.25, `Negated distress should remain low, got ${negatedScore}`);
  });

  it('handles positive negation: inverts negated resilience into distress signal', () => {
    const invertedResilience = "I haven't been sleeping well and I am not feeling good.";
    const genuineResilience = "I have been sleeping well and I am feeling good.";
    const invertedScore = calculateLexicalStressExtended(invertedResilience);
    const genuineScore = calculateLexicalStressExtended(genuineResilience);
    assert.ok(
      invertedScore > genuineScore,
      `Inverted resilience (${invertedScore}) should be strictly higher than genuine (${genuineScore})`
    );
    assert.ok(invertedScore >= 0.45, `Inverted resilience should reflect distress, got ${invertedScore}`);
  });

  it('analyzes dialog history across domains and produces tailored clinical headlines', () => {
    const history = [
      { theme: 'mood', prompt: 'How is your mood?', answer: "I feel really down and sad." },
      { theme: 'sleep', prompt: 'How is your sleep?', answer: "I haven't been able to sleep, tossing and turning all night with insomnia." },
      { theme: 'stress', prompt: 'How is your stress?', answer: "Work is completely overwhelming and I have splitting headaches." },
      { theme: 'energy', prompt: 'How is your energy?', answer: "Exhausted, running on empty." },
      { theme: 'coping', prompt: 'What helps you recharge?', answer: "Hard to cope right now." }
    ];

    const result = analyzeDomainResponses(history);
    assert.ok(result.elevatedDomains.length >= 2, `Expected at least 2 elevated domains, got ${result.elevatedDomains.length}`);
    assert.ok(result.elevatedDomains.includes('Sleep Quality'), 'Expected Sleep Quality in elevated domains');
    assert.ok(result.elevatedDomains.includes('Emotional Mood'), 'Expected Emotional Mood in elevated domains');
    assert.ok(
      result.headline.toLowerCase().includes('stress') ||
      result.headline.toLowerCase().includes('sleep') ||
      result.headline.toLowerCase().includes('mood') ||
      result.headline.toLowerCase().includes('talk'),
      `Expected tailored headline, got: ${result.headline}`
    );
  });

  it('generates steady calm headline when all responses reflect healthy balance', () => {
    const calmHistory = [
      { theme: 'mood', prompt: 'How is your mood?', answer: "Feeling calm, grounded, and very good." },
      { theme: 'sleep', prompt: 'How is your sleep?', answer: "Sleeping soundly through the night, waking up refreshed." },
      { theme: 'stress', prompt: 'How is your stress?', answer: "Work load is manageable and I feel at ease." },
      { theme: 'energy', prompt: 'How is your energy?', answer: "Energized and productive every day." },
      { theme: 'coping', prompt: 'What helps you recharge?', answer: "Taking walks in nature and spending time with family." }
    ];

    const result = analyzeDomainResponses(calmHistory);
    assert.strictEqual(result.elevatedDomains.length, 0, 'Expected 0 elevated domains for calm check-in');
    assert.ok(result.strengthDomains.length >= 2, 'Expected multiple strength domains');
    assert.ok(
      result.headline.toLowerCase().includes('steady') || result.headline.toLowerCase().includes('calm'),
      `Expected steady/calm headline, got: ${result.headline}`
    );
  });
});
