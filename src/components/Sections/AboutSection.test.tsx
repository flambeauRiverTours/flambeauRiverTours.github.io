import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutSection } from './AboutSection';
import { personalInfo } from '../../datamodel/portfolioData';

describe('AboutSection Executive Showcase', () => {
  it('renders executive bio, title, and key metric cards', () => {
    render(<AboutSection />);
    expect(screen.getByText(personalInfo.name)).toBeInTheDocument();
    expect(screen.getByText(personalInfo.tagline)).toBeInTheDocument();

    // Check Key Metric Cards are rendered
    personalInfo.metrics.forEach((metric) => {
      expect(screen.getByText(metric.value)).toBeInTheDocument();
      expect(screen.getByText(metric.label)).toBeInTheDocument();
    });
  });

  it('renders certifications section and items', () => {
    render(<AboutSection />);
    expect(screen.getByText('Professional Certifications')).toBeInTheDocument();
    personalInfo.certifications.forEach((cert) => {
      expect(screen.getByText(cert.title)).toBeInTheDocument();
    });
  });
});
