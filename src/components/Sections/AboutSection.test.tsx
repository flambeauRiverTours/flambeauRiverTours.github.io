import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AboutSection } from './AboutSection';
import { personalInfo, skills } from '../../datamodel/portfolioData';

describe('AboutSection', () => {
  it('renders personal bio and header information', () => {
    render(<AboutSection />);
    expect(screen.getByText(personalInfo.name)).toBeInTheDocument();
    expect(screen.getByText(personalInfo.title)).toBeInTheDocument();
    expect(screen.getByText(personalInfo.location)).toBeInTheDocument();
  });

  it('renders skill categories and skills', () => {
    render(<AboutSection />);
    personalInfo.skills.forEach((skillGroup) => {
      expect(screen.getByText(skillGroup.category)).toBeInTheDocument();
      skillGroup.items.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });
});
