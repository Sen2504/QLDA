import React from 'react';

const GradientCard = ({ 
  children, 
  className = '', 
  gradient = 'from-emerald-50 to-teal-50',
  borderColor = 'border-emerald-200'
}) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default GradientCard;
