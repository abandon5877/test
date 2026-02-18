import { describe, it, expect } from 'vitest';
import { calculator } from '../modules/calculator';

describe('Calculator Module', () => {
  describe('calculateSpell', () => {
    it('should calculate basic firebolt spell', () => {
      const spellChain = ['firebolt'];
      const result = calculator.calculateSpell(spellChain);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('火球');
      expect(result.dmg).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);
      expect(result.heal).toBe(0);
    });

    it('should calculate firebolt with amp modifier', () => {
      const spellChain = ['amp', 'firebolt'];
      const result = calculator.calculateSpell(spellChain);
      const basicResult = calculator.calculateSpell(['firebolt']);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('强化火球');
      expect(result.dmg).toBeGreaterThan(basicResult.dmg);
      expect(result.cost).toBeGreaterThan(basicResult.cost);
      expect(result.time).toBeGreaterThan(basicResult.time);
    });

    it('should calculate heal spell', () => {
      const spellChain = ['heal'];
      const result = calculator.calculateSpell(spellChain);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('治疗');
      expect(result.heal).toBeGreaterThan(0);
      expect(result.dmg).toBe(0);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);
    });

    it('should calculate heal with amp modifier', () => {
      const spellChain = ['amp', 'heal'];
      const result = calculator.calculateSpell(spellChain);
      const basicResult = calculator.calculateSpell(['heal']);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('强化治疗');
      expect(result.heal).toBeGreaterThanOrEqual(basicResult.heal);
      expect(result.cost).toBeGreaterThanOrEqual(basicResult.cost);
      expect(result.time).toBeGreaterThanOrEqual(basicResult.time);
    });

    it('should handle empty spell chain', () => {
      const spellChain: string[] = [];
      const result = calculator.calculateSpell(spellChain);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('无效法术');
      expect(result.dmg).toBe(0);
      expect(result.heal).toBe(0);
      expect(result.cost).toBe(0);
      expect(result.time).toBe(0);
    });

    it('should handle invalid runes', () => {
      const spellChain = ['invalid', 'firebolt'];
      const result = calculator.calculateSpell(spellChain);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('invalid火球');
      expect(result.dmg).toBeGreaterThan(0);
    });

    it('should handle multiple modifiers', () => {
      const spellChain = ['amp', 'quick', 'firebolt'];
      const result = calculator.calculateSpell(spellChain);
      const basicResult = calculator.calculateSpell(['firebolt']);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('强化迅捷火球');
      expect(result.dmg).toBeGreaterThanOrEqual(basicResult.dmg);
      expect(result.cost).toBeGreaterThanOrEqual(basicResult.cost);
    });

    it('should calculate spell with count modifier', () => {
      const spellChain = ['double', 'firebolt'];
      const result = calculator.calculateSpell(spellChain);
      const basicResult = calculator.calculateSpell(['firebolt']);
      
      expect(result).toBeTruthy();
      expect(result.name).toBe('双重火球');
      expect(result.dmg).toBeGreaterThan(basicResult.dmg);
      expect(result.cost).toBeGreaterThan(basicResult.cost);
      expect(result.time).toBeGreaterThan(basicResult.time);
    });
  });
});
