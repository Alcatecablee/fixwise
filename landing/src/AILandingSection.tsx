import React from 'react';

export default function AILandingSection() {
  return (
    <section className="relative px-6 py-24 text-center z-20 bg-[rgb(16,18,20)]">
      <div className="mx-auto max-w-[820px] text-left">
        <div className="text-white text-xl leading-7 max-h-[600px] overflow-y-auto scrollbar-none text-left">
          {/* Terminal-like content */}
          <div className="text-white text-xl leading-7 text-left">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                LLMs think in milliseconds.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                Humans think in milliseconds—and type in minutes.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <br />
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                We need a fundamental shift in how AI assists us.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <br />
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl font-bold leading-7 break-words">
                ChatGPT isn't the future.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                It's an interaction model built for an era that's about to end—where humans had to adapt to machines.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <br />
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl font-bold leading-7 break-words">
                AI is evolving faster than we're willing to adopt it.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                But the bottleneck isn't the technology.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                It's us.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl font-bold leading-7 break-words">
                AI is fast enough to replace millions of hours of human work—mundane, repetitive, often mindless.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <br />
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                People don't want to be replaced.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                They want to be <span className="italic">augmented</span>.
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <br />
          </div>
          
          <div className="relative mt-4">
            <div className="relative mb-4 break-words">
              <span className="inline text-xl leading-7 break-words">
                "Rather than AI being a competitor, it will become an extension of ourselves." -{' '}
                <span className="inline text-xl leading-7 break-words">Ray Kurzweil</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Call to action section */}
        <div className="text-center mt-12">
          <p className="text-white/90 text-xl leading-7 mb-6">
            Believe in our mission? Get involved:
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://calendly.com/joe-rightoncue/30min"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Invest
            </a>
            <a 
              href="https://app.dover.com/apply/Cue%20AI/bca65dc6-4d6f-4e42-8c2f-a8acf394297c?utm_source=website"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Join
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
