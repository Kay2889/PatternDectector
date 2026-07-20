import { DARK_PATTERN_PHRASES, DARK_PATTERN_TYPES } from './darkPatternsData';

export interface DetectedPattern {
  id: string;
  pattern_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  element_text: string;
  element_selector: string;
  recommendation: string;
}

const patternDescriptions: Record<string, string> = {
  confirmshaming: 'The dialog attempts to shame the user into accepting.',
  fake_timer: 'Creates artificial urgency with countdown timers.',
  hidden_costs: 'Reveals additional fees only at checkout.',
  forced_action: 'Requires unwanted action to proceed.',
  sneak_into_basket: 'Items added without explicit user consent.',
  misdirection: 'Focus drawn away from important information.',
  privacy_zuckering: 'Confusing options that lead to sharing more data.',
  obstruction: 'Makes simple tasks difficult.',
  roach_motel: 'Easy to get in, hard to get out.',
  preselected_checkbox: 'Opt-in checkboxes pre-selected by default.',
  bait_and_switch: 'Promises one thing but delivers another.',
  disguised_ads: 'Ads disguised as content.',
  trick_questions: 'Confusing wording to get unintended consent.',
};

const recommendations: Record<string, string> = {
  confirmshaming: 'Use neutral wording without emotional manipulation.',
  fake_timer: 'Use genuine deadlines that actually expire.',
  hidden_costs: 'Show all costs upfront before checkout.',
  forced_action: 'Allow users to proceed without registering.',
  sneak_into_basket: 'Require explicit consent for add-ons.',
  misdirection: 'Provide clear, honest information.',
  privacy_zuckering: 'Use clear default privacy settings.',
  obstruction: 'Make all actions equally easy.',
  roach_motel: 'Provide clear, easy exit options.',
  preselected_checkbox: 'Clear all checkboxes by default.',
  bait_and_switch: 'Ensure advertised offers match actual offers.',
  disguised_ads: 'Clearly label all advertisements.',
  trick_questions: 'Use simple, clear language.',
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function calculateConfidence(matches: string[], textLength: number): number {
  // Base confidence from number of matches
  const matchScore = Math.min(matches.length * 15, 60);

  // Bonus for longer matched phrases
  const avgMatchLength = matches.reduce((sum, m) => sum + m.length, 0) / matches.length;
  const lengthBonus = Math.min(avgMatchLength * 2, 20);

  // Penalty for very short text (likely false positive)
  const shortPenalty = textLength < 10 ? -15 : 0;

  return Math.min(Math.max(Math.round(matchScore + lengthBonus + shortPenalty + 20), 0), 100);
}

function detectPatternInText(text: string, patternType: string): { detected: boolean; matches: string[]; confidence: number } {
  const phrases = DARK_PATTERN_PHRASES[patternType] || [];
  const normalizedText = normalizeText(text);
  const matches: string[] = [];

  for (const phrase of phrases) {
    const normalizedPhrase = normalizeText(phrase);
    if (normalizedText.includes(normalizedPhrase)) {
      matches.push(phrase);
    }
  }

  if (matches.length === 0) {
    return { detected: false, matches: [], confidence: 0 };
  }

  const confidence = calculateConfidence(matches, text.length);
  return { detected: true, matches, confidence };
}

function estimateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(c => c && !c.includes(':'));
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.');
      }
    }

    const siblings = current.parentElement?.children || [];
    const sameTagSiblings = Array.from(siblings).filter(s => s.tagName === current!.tagName);
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;

    if (path.length >= 4) break;
  }

  return path.join(' > ');
}

export function analyzeHtmlContent(htmlContent: string): DetectedPattern[] {
  const detectedPatterns: DetectedPattern[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Elements to check for dark patterns
  const elementsToCheck = doc.querySelectorAll('button, a, input, label, p, span, div, h1, h2, h3, h4, h5, h6, li');

  const checkedTexts = new Set<string>();

  elementsToCheck.forEach((element) => {
    const text = element.textContent?.trim() || '';

    if (text.length < 3 || checkedTexts.has(normalizeText(text))) {
      return;
    }

    checkedTexts.add(normalizeText(text));

    DARK_PATTERN_TYPES.forEach(({ id, severity }) => {
      const result = detectPatternInText(text, id);

      if (result.detected && result.confidence > 40) {
        // Check if this pattern type was already detected with similar text
        const existingPattern = detectedPatterns.find(
          (p) => p.pattern_type === id && p.element_text.toLowerCase().includes(text.toLowerCase())
        );

        if (!existingPattern || result.confidence > existingPattern.confidence) {
          if (existingPattern) {
            detectedPatterns.splice(detectedPatterns.indexOf(existingPattern), 1);
          }

          detectedPatterns.push({
            id: `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pattern_type: id,
            confidence: result.confidence,
            severity: severity as 'low' | 'medium' | 'high',
            description: patternDescriptions[id] || 'Dark pattern detected.',
            element_text: text,
            element_selector: estimateSelector(element),
            recommendation: recommendations[id] || 'Review and remove manipulative design.',
          });
        }
      }
    });
  });

  // Check for preselected checkboxes
  const checkboxes = doc.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    if (checkbox.hasAttribute('checked') && !checkbox.hasAttribute('disabled')) {
      const label = checkbox.closest('label')?.textContent?.trim() || '';
      const isMarketing = /^(newsletter|updates|offers|marketing|emails?)/i.test(label);

      if (isMarketing || label.toLowerCase().includes('subscribe')) {
        detectedPatterns.push({
          id: `preselected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          pattern_type: 'preselected_checkbox',
          confidence: 85,
          severity: 'medium',
          description: 'Marketing/opt-in checkbox is pre-selected by default.',
          element_text: label || checkbox.name || 'Marketing checkbox',
          element_selector: estimateSelector(checkbox),
          recommendation: 'Clear all checkboxes by default.',
        });
      }
    }
  });

  // Check for hidden/obstructing elements
  const dismissButtons = doc.querySelectorAll('button, a, span');
  dismissButtons.forEach((button) => {
    const text = button.textContent?.trim().toLowerCase() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    const buttonText = text || ariaLabel;

    if (/^(x|close|√ó|dismiss)$/i.test(buttonText)) {
      const parent = button.parentElement;
      if (parent && getComputedStyle(parent).position === 'fixed') {
        const children = parent.querySelectorAll('button, a');
        const hasOtherOptions = Array.from(children).some((child) => {
          const childText = child.textContent?.toLowerCase() || '';
          return childText !== text && childText.length > 0;
        });

        if (hasOtherOptions && !detectedPatterns.some(p =>
          p.pattern_type === 'obstruction' && p.element_text.includes(buttonText)
        )) {
          detectedPatterns.push({
            id: `obstruction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pattern_type: 'obstruction',
            confidence: 70,
            severity: 'medium',
            description: 'Dismiss button may be intentionally hard to notice in modal.',
            element_text: buttonText,
            element_selector: estimateSelector(button),
            recommendation: 'Make dismissal options equally visible.',
          });
        }
      }
    }
  });

  return detectedPatterns.sort((a, b) => b.confidence - a.confidence);
}

export async function analyzeTextContent(text: string): Promise<DetectedPattern[]> {
  const detectedPatterns: DetectedPattern[] = [];
  const checkedTexts = new Set<string>();

  // Split text into lines/segments for analysis
  const segments = text.split(/[\n\r]+/);

  segments.forEach((segment) => {
    const trimmedSegment = segment.trim();

    if (trimmedSegment.length < 3 || checkedTexts.has(normalizeText(trimmedSegment))) {
      return;
    }

    checkedTexts.add(normalizeText(trimmedSegment));

    DARK_PATTERN_TYPES.forEach(({ id, severity }) => {
      const result = detectPatternInText(trimmedSegment, id);

      if (result.detected && result.confidence > 40) {
        const existingPattern = detectedPatterns.find(
          (p) => p.pattern_type === id &&
          normalizeText(p.element_text).includes(normalizeText(trimmedSegment))
        );

        if (!existingPattern || result.confidence > existingPattern.confidence) {
          if (existingPattern) {
            detectedPatterns.splice(detectedPatterns.indexOf(existingPattern), 1);
          }

          detectedPatterns.push({
            id: `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            pattern_type: id,
            confidence: result.confidence,
            severity: severity as 'low' | 'medium' | 'high',
            description: patternDescriptions[id] || 'Dark pattern detected.',
            element_text: trimmedSegment,
            element_selector: '',
            recommendation: recommendations[id] || 'Review and remove manipulative design.',
          });
        }
      }
    });
  });

  return detectedPatterns.sort((a, b) => b.confidence - a.confidence);
}
