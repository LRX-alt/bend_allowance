// tests/CalcolatoreLamiera.spec.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import CalcolatoreLamiera from '../src/components/CalcolatoreLamiera.vue';

describe('CalcolatoreLamiera.vue', () => {
  beforeAll(() => {
    // Mock del canvas per evitare errori durante il rendering
    HTMLCanvasElement.prototype.getContext = () => ({
      clearRect: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      restore: vi.fn(),
    });
  });

  it('renders correctly', () => {
    const wrapper = mount(CalcolatoreLamiera);
    expect(wrapper.exists()).toBe(true);
  });

  it('has default spessore value', () => {
    const wrapper = mount(CalcolatoreLamiera);
    expect(wrapper.vm.spessore).toBe(2.0);
  });
});
