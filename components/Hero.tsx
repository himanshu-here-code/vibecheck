import { SparkleIcon, SparkleSmall } from './Icons';

export function Hero() {
  return (
    <section className="relative">
      {/* Sparkles — positioned in outer corners so they never touch text */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[6%] top-[28%] hidden lg:block opacity-90">
          <SparkleIcon size={54} />
        </div>
        <div className="absolute right-[7%] top-[24%] hidden lg:block opacity-90">
          <SparkleSmall size={38} fill="#38bdf8" />
        </div>
        <div className="absolute left-[11%] bottom-[22%] hidden lg:block opacity-90">
          <SparkleSmall size={30} fill="#34d399" />
        </div>
      </div>

      <div className="container-tight relative pt-40 pb-16 text-center md:pt-48 md:pb-20">
        <h1 className="headline text-[60px] sm:text-[76px] md:text-[92px]">
          Is your app
          <br />
          <em>vibecoded?</em>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-muted">
          Scan any GitHub repo to strip out lazy AI UI and robotic copy.
          Make your vibecoded Vercel app feel like a real, handcrafted
          product.
        </p>
      </div>
    </section>
  );
}