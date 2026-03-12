/**
 * FormatConverter Tests
 * Requirements: 14.1-14.7, 19.1-19.7, 26.1-26.7
 */

import { describe, it, expect } from 'vitest';
import formatConverter from './formatConverter.js';

describe('FormatConverter', () => {
  describe('convertFormat', () => {
    it('should convert TXT to HTML', async () => {
      const txtContent = 'Hello World\nThis is a test.';
      const file = new File([txtContent], 'test.txt', { type: 'text/plain' });
      
      const result = await formatConverter.convertFormat(file, 'html');
      const html = await result.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Hello World<br>');
      expect(html).toContain('This is a test.');
    });

    it('should convert HTML to TXT', async () => {
      const htmlContent = '<html><body><p>Hello World</p><p>Test</p></body></html>';
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await formatConverter.convertFormat(file, 'txt');
      const text = await result.text();
      
      expect(text).toContain('Hello World');
      expect(text).toContain('Test');
      expect(text).not.toContain('<p>');
    });

    it('should convert TXT to JSON', async () => {
      const txtContent = 'Line 1\nLine 2\nLine 3';
      const file = new File([txtContent], 'test.txt', { type: 'text/plain' });
      
      const result = await formatConverter.convertFormat(file, 'json');
      const json = await result.text();
      const parsed = JSON.parse(json);
      
      expect(parsed.line_1).toBe('Line 1');
      expect(parsed.line_2).toBe('Line 2');
      expect(parsed.line_3).toBe('Line 3');
    });

    it('should throw error for unsupported conversion', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      await expect(
        formatConverter.convertFormat(file, 'html')
      ).rejects.toThrow('not supported');
    });
  });

  describe('reconstructFile', () => {
    it('should reconstruct file from segments', async () => {
      const segments = [
        { segment_number: 1, target_text: 'First segment' },
        { segment_number: 2, target_text: 'Second segment' },
        { segment_number: 3, target_text: 'Third segment' }
      ];
      
      const result = await formatConverter.reconstructFile('file-123', segments, 'txt');
      const text = await result.text();
      
      expect(text).toContain('First segment');
      expect(text).toContain('Second segment');
      expect(text).toContain('Third segment');
    });

    it('should sort segments by segment number', async () => {
      const segments = [
        { segment_number: 3, target_text: 'Third' },
        { segment_number: 1, target_text: 'First' },
        { segment_number: 2, target_text: 'Second' }
      ];
      
      const result = await formatConverter.reconstructFile('file-123', segments, 'txt');
      const text = await result.text();
      
      expect(text.indexOf('First')).toBeLessThan(text.indexOf('Second'));
      expect(text.indexOf('Second')).toBeLessThan(text.indexOf('Third'));
    });
  });

  describe('prettyPrint', () => {
    it('should format JSON with 2-space indent', () => {
      const content = { key1: 'value1', key2: 'value2' };
      
      const result = formatConverter.prettyPrint(content, 'json');
      
      expect(result).toContain('  "key1"');
      expect(result).toContain('  "key2"');
    });
  });

  describe('exportToXLIFF', () => {
    it('should create valid XLIFF structure', () => {
      const segments = [
        { id: 'seg1', source_text: 'Hello', target_text: 'Hola' },
        { id: 'seg2', source_text: 'World', target_text: 'Mundo' }
      ];
      
      const xliff = formatConverter.exportToXLIFF(segments);
      
      expect(xliff).toContain('<?xml version="1.0"');
      expect(xliff).toContain('<xliff version="1.2"');
      expect(xliff).toContain('<trans-unit id="seg1">');
      expect(xliff).toContain('<source>Hello</source>');
      expect(xliff).toContain('<target>Hola</target>');
    });

    it('should escape XML special characters', () => {
      const segments = [
        { source_text: 'Test & <tag>', target_text: 'Test & <tag>' }
      ];
      
      const xliff = formatConverter.exportToXLIFF(segments);
      
      expect(xliff).toContain('&amp;');
      expect(xliff).toContain('&lt;tag&gt;');
    });
  });

  describe('exportToTMX', () => {
    it('should create valid TMX structure', () => {
      const segments = [
        { source_text: 'Hello', target_text: 'Hola' },
        { source_text: 'World', target_text: 'Mundo' }
      ];
      
      const tmx = formatConverter.exportToTMX(segments);
      
      expect(tmx).toContain('<?xml version="1.0"');
      expect(tmx).toContain('<tmx version="1.4">');
      expect(tmx).toContain('<tu>');
      expect(tmx).toContain('<seg>Hello</seg>');
      expect(tmx).toContain('<seg>Hola</seg>');
    });

    it('should skip segments without target text', () => {
      const segments = [
        { source_text: 'Translated', target_text: 'Traducido' },
        { source_text: 'Untranslated', target_text: '' }
      ];
      
      const tmx = formatConverter.exportToTMX(segments);
      
      expect(tmx).toContain('<seg>Translated</seg>');
      expect(tmx).not.toContain('<seg>Untranslated</seg>');
    });
  });
});
