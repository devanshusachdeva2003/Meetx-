import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-300 font-sans selection:bg-primary/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-400">Last updated: June 21, 2026</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8 text-base leading-relaxed"
        >
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to MeetX. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
            <p className="mb-3">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li><strong className="text-gray-300">Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong className="text-gray-300">Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong className="text-gray-300">Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
              <li><strong className="text-gray-300">Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Google User Data</h2>
            <p>
              If you choose to log in using Google OAuth ("Continue with Google"), we will request access to your basic profile 
              information, including your name, email address, and profile picture. MeetX uses this information strictly to 
              create and authenticate your account on our platform. We do not sell or share this data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data 
              in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4 mt-3">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data 
              to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at: 
              <br /><strong className="text-primary mt-2 inline-block">privacy@meetx.com</strong>
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
