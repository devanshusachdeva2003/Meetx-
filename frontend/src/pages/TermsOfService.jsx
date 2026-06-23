import React from "react";
import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-400">Last updated: June 21, 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8 text-base leading-relaxed"
        >
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using the MeetX platform, you agree to be bound by
              these Terms of Service and all applicable laws and regulations. If
              you do not agree with any of these terms, you are prohibited from
              using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Use License
            </h2>
            <p className="mb-3">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on MeetX's website for
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li>Modify or copy the materials;</li>
              <li>
                Use the materials for any commercial purpose, or for any public
                display (commercial or non-commercial);
              </li>
              <li>
                Attempt to decompile or reverse engineer any software contained
                on MeetX's website;
              </li>
              <li>
                Remove any copyright or other proprietary notations from the
                materials;
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. User Accounts
            </h2>
            <p>
              When you create an account with us, including via third-party
              providers like Google, you must provide us information that is
              accurate, complete, and current at all times. Failure to do so
              constitutes a breach of the Terms, which may result in immediate
              termination of your account on our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Acceptable Use
            </h2>
            <p>
              You agree not to use the platform to stream, share, or broadcast
              content that is illegal, abusive, harassing, or violates the
              intellectual property rights of others. We reserve the right to
              terminate accounts that violate these acceptable use policies
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Disclaimer
            </h2>
            <p>
              The materials on MeetX's website are provided on an 'as is' basis.
              MeetX makes no warranties, expressed or implied, and hereby
              disclaims and negates all other warranties including, without
              limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of
              intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
