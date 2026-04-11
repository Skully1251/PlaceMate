import React, { forwardRef } from 'react';
const TimelineItem = forwardRef(({ title, description, icon, index }, ref) => {
  const isLeft = index % 2 === 0;
  return (
    <div ref={ref} className={`relative flex items-center w-full mb-12 md:mb-16 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col md:flex-row`}>
      <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
        <div className="group p-6 md:p-8 hover:bg-white/[0.03] rounded-2xl transition-all duration-500">
          <div className="w-12 h-12 mb-4 rounded-xl bg-violet/15 flex items-center justify-center text-violet group-hover:scale-110 group-hover:bg-violet/20 transition-all duration-300">{icon}</div>
          <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
          <p className="text-white/30 leading-relaxed text-sm md:text-base">{description}</p>
        </div>
      </div>
      <div className="hidden md:flex w-2/12 justify-center"><div className="w-3 h-3 rounded-full bg-violet ring-4 ring-violet/10 shadow-lg shadow-violet/20 z-10" /></div>
      <div className="hidden md:block w-5/12" />
    </div>
  );
});
TimelineItem.displayName = 'TimelineItem';
export default TimelineItem;
