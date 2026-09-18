import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CareerSection } from './CareerSection';
import { careerData } from '../../datamodel/portfolioData';

describe('CareerSection', () => {
  it('renders experience items and career achievements', () => {
    render(<CareerSection />);
    expect(screen.getByText('My Career')).toBeInTheDocument();
    careerData.forEach((item) => {
      expect(screen.getAllByText(item.role).length).toBeGreaterThan(0);
      expect(screen.getAllByText(item.company).length).toBeGreaterThan(0);
    });
  });
});
