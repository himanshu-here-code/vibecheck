import { SparkleIcon, SparkleSmall } from './Icons';

export function Hero() {
  return (
    <section className="relative">
      <div className="container-tight relative pt-24 pb-12 text-center md:pt-32 md:pb-16">
        <div className="absolute left-0 top-20 hidden sm:block">
          <SparkleIcon size={56} />
        </div>
        <div className="absolute right-4 top-28 hidden sm:block">
          <SparkleSmall size={40} fill="#38bdf8" />
        </div>
        <div className="absolute left-12 bottom-8 hidden md:block">
          <SparkleSmall size={32} fill="#34d399" />
        </div>

        <h1 className="headline text-[64px] sm:text-[80px] md:text-[96px]">
          Is your app
          <br />
          <em>vibecoded?</em>
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-[17px] leading-relaxed text-muted">
          Scan any GitHub repo to strip out lazy AI UI and robotic copy.
Make your vibecoded Vercel app feel like a real, handcrafted product.
        </p>
      </div>
    </section>
  );
}