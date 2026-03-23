export default function CTASection() {
  return (
    <section className="px-8 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary rounded-[3rem] p-16 lg:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full -mr-48 -mt-48 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-on-primary-container rounded-full -ml-48 -mb-48 opacity-10 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-6xl font-extrabold font-headline text-on-primary mb-8">Secure Your Command</h2>
            <p className="text-on-primary-container text-xl mb-12 max-w-[600px] mx-auto leading-relaxed">Join the next generation of academic architects. Request early access to the Pilot Dashboard.</p>
            <div className="flex flex-col sm:flex-row max-w-[600px] mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <input
                className="flex-grow bg-transparent border-none text-on-primary placeholder:text-on-primary-container focus:ring-0 px-6 py-4 text-lg outline-none"
                placeholder="Institutional email address"
                type="email"
              />
              <button className="bg-on-primary text-primary font-bold px-10 py-4 rounded-xl hover:bg-surface-bright transition-all active:scale-95 text-lg">
                Request Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
