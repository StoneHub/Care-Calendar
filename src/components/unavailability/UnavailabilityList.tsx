import React from 'react';

interface UnavailabilityListProps {
  caregiverId?: number;
  onEdit?: (id: number) => void;
}

const UnavailabilityList: React.FC<UnavailabilityListProps> = () => {
  return (
    <div className="p-4 text-center text-gray-500">
      <p>Unavailability management will be added in a future update.</p>
    </div>
  );
};

export default UnavailabilityList;