import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectsSection } from './ProjectsSection';
import { caseStudiesData } from '../../datamodel/portfolioData';

describe('ProjectsSection Architectural Case Studies', () => {
  it('renders case studies header and problem/solution cards', () => {
    render(<ProjectsSection />);
    expect(screen.getByText('Architectural & Engineering Case Studies')).toBeInTheDocument();

    caseStudiesData.forEach((cs) => {
      expect(screen.getByText(cs.title)).toBeInTheDocument();
      expect(screen.getByText(cs.problemStatement)).toBeInTheDocument();
    });
  });
});
