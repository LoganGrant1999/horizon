import { BodyMap, MedicalLabel } from '@/components/BodyMap';

/**
 * Example usage of the BodyMap component
 * This shows how to integrate medical history data with the body diagram
 */
export default function BodyMapExample() {
  const labels: MedicalLabel[] = [
    {
      part: 'head',
      title: 'Head',
      conditions: ['Chronic Migraine', 'Tension Headaches'],
    },
    {
      part: 'chest',
      title: 'Chest',
      conditions: ['Asthma', 'Shortness of Breath'],
    },
    {
      part: 'stomach',
      title: 'Abdomen',
      conditions: ['Gastric Ulcer', 'GERD', 'IBS'],
    },
    {
      part: 'left_leg',
      title: 'Left Leg',
      conditions: ['Varicose Veins'],
    },
  ];

  const handlePartClick = (part: string) => {
    console.log(`Clicked on: ${part}`);
    // You can add navigation or modal logic here
    // For example: navigate to a detailed view of that body part
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Medical Body Map
          </h1>
          <p className="text-gray-600">
            Click on body parts to view or add medical conditions
          </p>
        </div>

        <BodyMap labels={labels} onPartClick={handlePartClick} />

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#00BFA6] mb-4">How to Use</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-[#F8B400] mr-2">•</span>
              <span><strong>Hover</strong> over body parts or labels to highlight connections</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#F8B400] mr-2">•</span>
              <span><strong>Click</strong> on body parts to view detailed information</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#F8B400] mr-2">•</span>
              <span>Body parts with conditions are highlighted in <span className="text-[#00BFA6] font-semibold">teal</span></span>
            </li>
            <li className="flex items-start">
              <span className="text-[#F8B400] mr-2">•</span>
              <span>Leader lines connect each condition to its location on the body</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Minimal usage example
 */
export function MinimalBodyMapExample() {
  const labels: MedicalLabel[] = [
    { part: 'head', title: 'Head', conditions: ['Migraine'] },
    { part: 'chest', title: 'Chest', conditions: ['Asthma'] },
    { part: 'stomach', title: 'Abdomen', conditions: ['Ulcer'] },
  ];

  return (
    <div className="p-8">
      <BodyMap labels={labels} />
    </div>
  );
}

/**
 * Alternative: With API data integration
 */
export function BodyMapWithAPIExample() {
  // In a real app, you would fetch this from your API
  // Example: const { data: labels } = useQuery('/api/medical-history');

  const labels: MedicalLabel[] = [
    {
      part: 'heart', // Note: you might map 'chest' to heart region
      title: 'Cardiovascular',
      conditions: [
        'Atrial Fibrillation',
        'Hypertension',
        'High Cholesterol',
      ],
    },
    {
      part: 'left_arm',
      title: 'Left Arm',
      conditions: ['Carpal Tunnel Syndrome', 'Tendonitis'],
    },
    {
      part: 'right_leg',
      title: 'Right Leg',
      conditions: ['Knee Arthritis', 'Plantar Fasciitis'],
    },
  ];

  const handlePartClick = (part: string) => {
    // Navigate to detailed view
    console.log(`Navigate to /medical-history/${part}`);
  };

  return <BodyMap labels={labels} onPartClick={handlePartClick} />;
}