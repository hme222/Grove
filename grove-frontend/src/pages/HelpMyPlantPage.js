import React from 'react';
import { PageHeader } from '../components/PageHeader';
import SymptomHelp from '../components/help/SymptomHelp';

export default function HelpMyPlantPage() {
  return (
    <div className="pb-24">
      <PageHeader
        title="Help my plant"
        back
      />
      <div className="max-w-column mx-auto px-4 py-5">
        <SymptomHelp />
      </div>
    </div>
  );
}
