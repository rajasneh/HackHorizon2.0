import './MeetzSpinner.css';

export const MeetzSpinner = () => {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div className="relative w-24 h-24">
        {/* Outer ring spinning clockwise */}
        <div className="absolute inset-0 border-4 border-t-transparent border-[#1A73E8] rounded-full animate-spin" />

        {/* Middle ring spinning counterclockwise */}
        <div className="absolute inset-2 border-4 border-b-transparent border-[#FF5722] rounded-full animate-[spinReverse_1.5s_linear_infinite]" />

        {/* Inner ring spinning clockwise */}
        <div
          className="absolute inset-4 border-4 border-r-transparent border-[#1A73E8] rounded-full animate-spin"
          style={{ animationDuration: '2s' }}
        />

        {/* Center logo */}
        <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-bold">
            <span className="text-[#1A73E8]">Tkt</span>
            <span className="text-[#FF5722]">Plz</span>
          </span>
        </div>
      </div>
    </div>
  );
};