import React from 'react';
import { Brain, Layers, Sliders, Lock, Workflow } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => {
  return (
    <div className="bg-navy-800/50 backdrop-blur-sm border border-navy-700 rounded-xl p-6 transition-all duration-300 hover:border-opacity-50 hover:shadow-lg hover:shadow-blue-500/10 group">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} bg-opacity-10 border border-opacity-20`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-cyber-blue transition-colors duration-300">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
};

export function ValueProposition() {
  const features: FeatureCardProps[] = [
    {
      icon: Brain,
      title: "Domain-Specific Expertise",
      description: "Access deeply specialized templates with industry-specific knowledge, terminology, and best practices pre-configured for your field.",
      color: "bg-cyber-neon border-cyber-neon text-cyber-neon"
    },
    {
      icon: Layers,
      title: "Multi-Model Orchestration",
      description: "Seamlessly switch between different AI models within the same conversation, optimizing for specific tasks and balancing cost/performance.",
      color: "bg-cyber-blue border-cyber-blue text-cyber-blue"
    },
    {
      icon: Sliders,
      title: "Deep Customization, Simple Interface",
      description: "Enterprise-grade customization with consumer-grade usability. Adjust personality and style without prompt engineering expertise.",
      color: "bg-cyber-orange border-cyber-orange text-cyber-orange"
    },
    {
      icon: Lock,
      title: "User-Owned Data & Privacy",
      description: "Complete control over your data with options to use personal API keys, keeping conversations within your account with the AI provider.",
      color: "bg-purple-500 border-purple-500 text-purple-500"
    },
    {
      icon: Workflow,
      title: "Workflow Integration",
      description: "Purpose-built assistants designed to integrate into professional workflows with consistent personalities across interaction points.",
      color: "bg-teal-500 border-teal-500 text-teal-500"
    }
  ];

  return (
    <section id="about" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Why <span className="text-cyber-blue">SlipSpace</span>AI?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're not just another AI chat platform. SlipspaceAI delivers specialized tools for professionals who need more than generic AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/20 rounded-xl">
            <h3 className="text-2xl font-semibold mb-4 text-white">Perfect For</h3>
            <ul className="text-left space-y-3">
              <li className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-cyber-blue font-bold">✓</span>
                </div>
                <span className="text-gray-300">Professional Services Teams needing consistent AI assistance</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-cyber-blue font-bold">✓</span>
                </div>
                <span className="text-gray-300">Technical Organizations requiring specialized knowledge</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-cyber-blue font-bold">✓</span>
                </div>
                <span className="text-gray-300">Content Creation Teams seeking consistent brand voice</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-cyber-blue font-bold">✓</span>
                </div>
                <span className="text-gray-300">Businesses with Compliance Requirements needing auditable AI interactions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
