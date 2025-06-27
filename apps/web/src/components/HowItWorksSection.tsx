'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Define ContentKey as a union of string literals
type ContentKey =
  | 'Getting Started'
  | 'Usage Scenarios'
  | 'Features'
  | 'FAQ'
  | 'Data Security'
  | 'Privacy';

// Define ContentItem type
type ContentItem = {
  icon: string;
  title?: string;
  description?: string;
  question?: string;
  answer?: string;
  sub_icon?: string;
};

// Define Content type using ContentKey
type Content = {
  // eslint-disable-next-line no-unused-vars
  [key in ContentKey]: ContentItem[];
};

// Define tabs array with ContentKey type
const tabs: ContentKey[] = [
  'Getting Started',
  'Usage Scenarios',
  'Features',
  'FAQ',
  'Data Security',
  'Privacy'
]

// Define content object with Content type
const content: Content = {
  'Getting Started': [
    {
      icon: '/KeyCreation.svg',
      title: 'Where can I create a public/private key pair?',
      description:
        'Click "Settings", go to the "Keys" section, and create a key pair to obtain your encryption public key and decryption private key.'
    },
    {
      icon: '/FileEncryption.svg',
      title: 'How to encrypt a file?',
      description:
        'Select or drag the file to be encrypted; the system will automatically detect the file type. Enter or choose a public key, then click "Encrypt" to start.'
    },
    {
      icon: '/FileDecryption.svg',
      title: 'How to decrypt a received encrypted file?',
      description:
        'Upload the encrypted file; the system will recognize it. Enter the correct private key and click "Decrypt" to view the content.'
    },
    {
      icon: '/TextEncryption.svg',
      title: 'Can I encrypt text?',
      description:
        'Yes. On the homepage, switch to "Paste Text" mode, paste your content, enter the key, and click "Encrypt".'
    }
  ],
  'Usage Scenarios': [
    {
      icon: '/SendFiles.svg',
      title: 'Send Encrypted Files to Others',
      description:
        'Use the recipient\'s public key to encrypt the file. Then send the encrypted file through other means, such as cloud storage or email. Only the recipient can decrypt it using their private key.'
    },
    {
      icon: '/EncryptFiles.svg',
      title: 'Encrypt Your Own Files',
      description:
        'First, create a key pair (public key and private key) under the "Keys" section. Use your public key to encrypt files, and later use your private key to decrypt them.'
    },
    {
      icon: '/QuickEncrypt.svg',
      title: 'Quick Encryption',
      description:
        'You can share your public key link directly. Others can open the link to encrypt files instantly, without needing to enter your key manually.'
    },
    {
      icon: '/ArchiveFiles.svg',
      title: 'I\'d like to encrypt and archive company files. Is that possible?',
      description:
        'Absolutely. We recommend that you create a key pair and keep the private key safe. You can then use it to encrypt and store or archive internal company files.'
    }
  ],
  Features: [
    {
      icon: '/EncryptionMethod.svg',
      title: 'What encryption methods are supported?',
      description: 'Asymmetric encryption is supported (using public-private key pairs).'
    },
    {
      icon: '/FileTypeSupport.svg',
      title: 'What file types are supported?',
      description:
        'Common document, image, archive, audio, and video formats are supported. A single file can be up to 100MB, and text is limited to 10,000 characters.'
    },
    {
      icon: '/PublicKeyLink.svg',
      title: 'Public key link encryption',
      description:
        'You can share a public key link to allow others to encrypt documents and send them to you securely.'
    }
  ],
  FAQ: [
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'Do I need to create my own keys?',
      answer:
        'Yes. If you want to encrypt files or receive encrypted files from others, we recommend creating your own key pair.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'How do I share my public key?',
      answer:
        'After creating a key pair, you can copy the public key or the generated public key link for others to use.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'What if I forget my private key or password?',
      answer:
        'We cannot retrieve your private key or password. Please back them up safely and do not share them. Without them, you cannot decrypt data.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'Do I need to enter the security password every time?',
      answer:
        'Yes. To ensure security, you must enter your password each time you access the Keys section.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'What if I forget the security password?',
      answer:
        'You can reset your account to set a new security password. Be sure to back up your data before resetting, and you can later import it to restore your key data.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'Can I encrypt multiple files at once?',
      answer: 'No. Only one file can be encrypted at a time.'
    }
  ],
  'Data Security': [
    {
      icon: '/LocalProcessing.svg',
      title: 'Are my files uploaded to the server?',
      description:
        'No. All encryption/decryption operations are performed locally in your browser. No data is uploaded or stored.'
    },
    {
      icon: '/EndToEndEncryption.svg',
      title: 'Can you access my private key?',
      description:
        'No. The private key is stored locally and protected by your security password. We cannot access or read it.'
    }
  ],
  Privacy: [
    {
      icon: '/PrivacyTracking.svg',
      title: 'Do you track my usage?',
      description:
        'No. This tool does not track, store, or upload any user data. It operates entirely locally for complete privacy protection.'
    },
    {
      icon: '/KeyDeletion.svg',
      title: 'How can I completely remove my keys?',
      description:
        'You can delete your key pair in the key management section. Once deleted, it cannot be recovered. You can also reset your account to remove all key data.'
    }
  ]
}

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<ContentKey>('Getting Started')

  const renderContent = () => {
    const currentContent = content[activeTab]
    // No need for undefined check since ContentKey ensures valid keys
    // Getting Started & Usage Scenarios - Grid Layout
    if (['Getting Started', 'Usage Scenarios', 'Data Security', 'Privacy'].includes(activeTab)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
          {currentContent.map((item, index) => (
            <div key={index} className="flex items-center flex-col bg-gray-100 rounded-lg p-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src={item.icon}
                  alt={item.title || 'Icon'}
                  width={48}
                  height={48}
                  className="w-12 h-12 text-gray-400"
                />
              </div>
              <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">
                {item.title}
              </h3>
              <p className="text-[#00000099] text-sm leading-relaxed text-center">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )
    }

    // Features - List Layout
    if (activeTab === 'Features') {
      return (
        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
          {currentContent.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Image
                  src={item.icon}
                  alt={item.title || 'Icon'}
                  width={48}
                  height={48}
                  className="w-12 h-12 text-gray-400"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  {item.title}
                </h3>
                <p className="text-[#00000099] text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // FAQ - Q&A Layout
    if (activeTab === 'FAQ') {
      return (
        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
          {currentContent.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Image
                    src={item.icon}
                    alt={item.question || 'Question Icon'}
                    width={20}
                    height={20}
                    className="w-5 h-5 text-gray-400"
                  />
                </div>
                <h3 className="text-lg font-semibold text-blue-700">
                  {item.question}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Image
                    src={item.sub_icon!}
                    alt={item.answer || 'Answer Icon'}
                    width={20}
                    height={20}
                    className="w-5 h-5 text-gray-400"
                  />
                </div>
                <p className="text-[#00000099] text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
                activeTab === tab
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab}
            </Button>
          ))}
        </div>

        {renderContent()}
      </div>
    </section>
  )
}
