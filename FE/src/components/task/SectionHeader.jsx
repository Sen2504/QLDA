import React from 'react';

const SectionHeader = ({ icon: Icon, title, badge = null, gradient = 'from-emerald-600 to-teal-600' }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className={`w-4 h-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`} strokeWidth={2.5} />}
      <h2 className={`text-xs font-bold uppercase bg-gradient-to-r ${gradient} bg-clip-text text-transparent tracking-wide`}>
        {title}
      </h2>
      {badge}
    </div>
  );
};

export default SectionHeader;
