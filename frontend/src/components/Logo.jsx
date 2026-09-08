/* Uses the real uploaded logo asset from public/. Do not recreate this as
   SVG or separate icon+text — the file itself is the complete lockup. */
export function Logo({ className = "h-10" }) {
  return <img src="/TripSync.logo_2.jpg" alt="TripSync" className={`${className} object-contain`} />;
}