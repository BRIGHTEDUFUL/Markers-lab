import React from "react";
import { motion } from "motion/react";
import { Globe, Users, Award, Rocket, ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import PageHero from "../components/PageHero";
import { useTheme } from "../contexts/ThemeContext";

const team = [
  {
    name: "Amani Richards",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    bio: "Visionary leader with 15+ years in digital architecture and avant-garde design.",
    socials: { twitter: "#", linkedin: "#", github: "#" }
  },
  {
    name: "Kofi Mensah",
    role: "Chief Technology Officer",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
    bio: "Specialist in distributed systems and high-performance computing architectures.",
    socials: { twitter: "#", linkedin: "#", github: "#" }
  },
  {
    name: "Jaden Smith",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    bio: "Pioneering new ways to integrate neural networks into everyday creative workflows.",
    socials: { twitter: "#", linkedin: "#", github: "#" }
  }
];

export const About: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#050505]'}`}>
      <PageHero 
        title={`Architects of <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? '#0f172a' : 'white'}'>Digital</span> Culture`}
        subtitle="Maker’s Lab is a high-end creative platform where ideas merge with execution. We blend technical excellence with avant-garde design to build software that resonates."
        category="The Philosophy"
      />

      <div className="relative z-10">
        {/* Mission Section */}
        <section className="py-32 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <span className="text-indigo-500 text-[11px] font-bold uppercase tracking-[0.5em]">Our Mission</span>
                <h2 className={`text-4xl sm:text-5xl md:text-7xl font-display uppercase leading-[0.9] tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Redefining the <br /> <span className="italic">Standard</span> of Digital Craft
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`text-xl font-light leading-relaxed max-w-2xl ${theme === 'light' ? 'text-slate-600' : 'text-white/60'}`}
              >
                We believe that software should not just be functional—it should be an experience. Our mission is to bridge the gap between complex engineering and human-centric design, creating tools that empower and inspire.
              </motion.p>
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div>
                  <h4 className={`text-4xl font-display mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>150+</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Projects Delivered</p>
                </div>
                <div>
                  <h4 className={`text-4xl font-display mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>24</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Global Awards</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative aspect-square">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`absolute inset-0 rounded-[3rem] border overflow-hidden ${theme === 'light' ? 'border-slate-200 shadow-2xl shadow-slate-200/50' : 'border-white/10 shadow-2xl shadow-indigo-500/5'}`}
              >
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070" 
                  alt="Team Collaboration" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse" />
            </div>
          </div>
        </section>

        {/* Philosophy Grid */}
        <section className={`grid grid-cols-1 md:grid-cols-2 border-y transition-colors duration-700 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          <div className={`p-12 md:p-24 border-r transition-colors duration-700 flex flex-col justify-center ${theme === 'light' ? 'border-slate-200 bg-white' : 'border-white/5 bg-white/2'}`}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-10"
            >
              <h2 className={`text-4xl sm:text-5xl md:text-7xl font-display uppercase leading-[0.9] tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Uncompromising <br /> Precision
              </h2>
              <p className={`font-sans leading-relaxed text-xl font-light transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-white/40'}`}>
                Every line of code is a brushstroke. We don't just build features; we architect systems that are as beautiful internally as they are externally. Our commitment to technical excellence is absolute.
              </p>
              <div className="flex items-center space-x-6 text-indigo-500">
                <div className="h-[1px] w-16 bg-indigo-500" />
                <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Technical Mastery</span>
              </div>
            </motion.div>
          </div>
          <div className="relative h-[500px] md:h-auto overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2072" 
              alt="Maker’s Lab" 
              className={`absolute inset-0 w-full h-full object-cover grayscale transition-all duration-[2s] group-hover:scale-110 group-hover:grayscale-0 ${theme === 'light' ? 'opacity-90' : 'opacity-70'}`}
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 bg-gradient-to-r transition-colors duration-700 ${theme === 'light' ? 'from-white via-white/20 to-transparent' : 'from-[#050505] via-[#050505]/20 to-transparent'}`} />
            <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        </section>

        {/* Values Section */}
        <section className="py-48 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { 
                title: "Innovation First", 
                desc: "We explore the bleeding edge of technology to provide our clients with a competitive advantage in an ever-evolving landscape.",
                icon: Rocket 
              },
              { 
                title: "Global Reach", 
                desc: "Maker’s Lab operates at the intersection of global trends, bringing a diverse perspective to every project we undertake.",
                icon: Globe 
              },
              { 
                title: "Elite Talent", 
                desc: "A collective of senior engineers and visionary designers dedicated to pushing the boundaries of what's possible.",
                icon: Users 
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="space-y-8 group"
              >
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 group-hover:border-indigo-500/50' : 'bg-white/5 border-white/10 group-hover:border-indigo-500/50'}`}>
                  <value.icon className={`h-8 w-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400 group-hover:text-indigo-600' : 'text-white/40 group-hover:text-indigo-400'}`} />
                </div>
                <h3 className={`text-2xl font-display uppercase tracking-tight transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{value.title}</h3>
                <p className={`font-sans leading-relaxed text-lg font-light transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-white/40'}`}>{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className={`py-48 px-4 border-t transition-colors duration-700 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-indigo-500 text-[11px] font-bold uppercase tracking-[0.5em] mb-6"
                >
                  The Collective
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`text-5xl sm:text-6xl md:text-8xl font-display uppercase leading-[0.85] tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
                >
                  Visionaries behind <br /> the <span className={`italic text-transparent transition-all duration-500`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Execution</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className={`font-sans max-w-sm leading-relaxed text-lg font-light transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}
              >
                A curated group of specialists dedicated to redefining digital boundaries through technical mastery and artistic vision.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {team.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="group relative"
                >
                  <motion.div
                    whileHover={{ y: -15 }}
                    className={`relative aspect-[3/4] overflow-hidden rounded-[2.5rem] border transition-all duration-700 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/5 border-white/10'}`}
                  >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <motion.img
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.8 }}
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                      referrerPolicy="no-referrer"
                    />

                    {/* Social Links Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-8 group-hover:translate-y-0">
                      {[
                        { icon: Twitter, href: member.socials.twitter },
                        { icon: Linkedin, href: member.socials.linkedin },
                        { icon: Github, href: member.socials.github }
                      ].map((social, idx) => (
                        <a 
                          key={idx}
                          href={social.href} 
                          className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-indigo-500 hover:scale-110 transition-all duration-500 border border-white/10"
                        >
                          <social.icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </motion.div>

                  <div className="mt-8 space-y-2 px-4">
                    <h3 className={`text-2xl font-display uppercase tracking-tight transition-colors duration-500 group-hover:text-indigo-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{member.name}</h3>
                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-2">{member.role}</p>
                    <p className={`text-xs font-light leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                      {member.bio}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-32 sm:py-48 border-t transition-colors duration-700 text-center space-y-12 sm:space-y-16 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          <h2 className={`text-5xl sm:text-6xl md:text-9xl font-display uppercase leading-none tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Ready to <br />
            <span className={`italic text-transparent transition-all duration-700`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Collaborate?</span>
          </h2>
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className={`px-12 sm:px-20 py-6 sm:py-10 font-bold uppercase tracking-[0.4em] text-[10px] sm:text-[11px] transition-all duration-700 shadow-2xl ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
          >
            Initiate Project
          </motion.button>
        </section>
      </div>
    </div>
  );
};
