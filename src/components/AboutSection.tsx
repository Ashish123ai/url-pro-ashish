import React from 'react';
import { Shield, Users, Award, ExternalLink } from 'lucide-react';

const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* About PhishDetector */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl text-white p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">About PhishDetector</h2>
            <p className="text-xl text-slate-200 leading-relaxed max-w-4xl mx-auto">
              Phishing is an internet scam in which an attacker sends out fake messages that look to come from a trusted source. A URL or file will be included in the mail, which when clicked will steal personal information or infect a computer with a virus. Phish Detector is a project which aims to help reduce phishing attack by helping internet users authenticate URL link by testing if it is phishing or legitimate. The progress of validating a Website URL for phishing or legitimate has gone through several Machine learning models.
            </p>
          </div>

          {/* About Us */}
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-8">About Us</h3>
            <p className="text-lg text-slate-200 mb-8">
              This Project is done by Third Year Students of Information Technology of PSIT(College)
            </p>

            {/* Team Members */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibent">Ashish Chaurasiya</h4>
                <p className="text-slate-300">Information Technology</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold">Kushagra</h4>
                <p className="text-slate-300">Information Technology</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold">Arpit</h4>
                <p className="text-slate-300">Information Technology</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibent">Ayush</h4>
                <p className="text-slate-300">Information Technology</p>
              </div>
            </div>

            {/* Guided By */}
            <div className="border-t border-slate-600 pt-8">
              <h4 className="text-lg font-semibold text-slate-300 mb-2">Guided By</h4>
              <h3 className="text-2xl font-bold">...</h3>
              <p className="text-slate-300">Project Supervisor</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Analysis</h3>
            <p className="text-gray-600">Advanced algorithms analyze URLs in real-time to detect phishing attempts</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">High Accuracy</h3>
            <p className="text-gray-600">Machine learning models trained on extensive datasets for reliable detection</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">User Friendly</h3>
            <p className="text-gray-600">Simple interface designed for users of all technical backgrounds</p>
          </div>
        </div>

       
      </div>
    </section>
  );
};

export default AboutSection;