'use client'

import {
  Button,
  cn
} from '@nsiod/share-ui'
import { useState, useMemo } from 'react'

// Type definitions
type ContentKey =
  | 'Getting Started'
  | 'Usage Scenarios'
  | 'Features'
  | 'FAQ'
  | 'Data Security'
  | 'Privacy'

interface BaseContentItem {
  icon: string
  title?: string
  description?: string
}

interface FAQContentItem extends BaseContentItem {
  question: string
  answer: string
  sub_icon: string
}

type ContentItem = BaseContentItem | FAQContentItem

type Content = Record<ContentKey, ContentItem[]>

// Constants
const TABS: ContentKey[] = [
  'Getting Started',
  'Usage Scenarios',
  'Features',
  'FAQ',
  'Data Security',
  'Privacy'
]

const GRID_LAYOUT_TABS = ['Getting Started', 'Usage Scenarios', 'Data Security', 'Privacy']

const CONTENT: Content = {
  'Getting Started': [
    {
      icon: '/KeyCreation.svg',
      title: 'Where can I create a public/private key pair?',
      description: 'Click "Settings", go to the "Keys" section, and create a key pair to obtain your encryption public key and decryption private key.'
    },
    {
      icon: '/FileEncryption.svg',
      title: 'How to encrypt a file?',
      description: 'Select or drag the file to be encrypted; the system will automatically detect the file type. Enter or choose a public key, then click "Encrypt" to start.'
    },
    {
      icon: '/FileDecryption.svg',
      title: 'How to decrypt a received encrypted file?',
      description: 'Upload the encrypted file; the system will recognize it. Enter the correct private key and click "Decrypt" to view the content.'
    },
    {
      icon: '/TextEncryption.svg',
      title: 'Can I encrypt text?',
      description: 'Yes. On the homepage, switch to "Paste Text" mode, paste your content, enter the key, and click "Encrypt".'
    }
  ],
  'Usage Scenarios': [
    {
      icon: '/SendFiles.svg',
      title: 'Send Encrypted Files to Others',
      description: 'Use the recipient\'s public key to encrypt the file. Then send the encrypted file through other means, such as cloud storage or email. Only the recipient can decrypt it using their private key.'
    },
    {
      icon: '/EncryptFiles.svg',
      title: 'Encrypt Your Own Files',
      description: 'First, create a key pair (public key and private key) under the "Keys" section. Use your public key to encrypt files, and later use your private key to decrypt them.'
    },
    {
      icon: '/QuickEncrypt.svg',
      title: 'Quick Encryption',
      description: 'You can share your public key link directly. Others can open the link to encrypt files instantly, without needing to enter your key manually.'
    },
    {
      icon: '/ArchiveFiles.svg',
      title: 'I\'d like to encrypt and archive company files. Is that possible?',
      description: 'Absolutely. We recommend that you create a key pair and keep the private key safe. You can then use it to encrypt and store or archive internal company files.'
    }
  ],
  'Features': [
    {
      icon: '/EncryptionMethod.svg',
      title: 'What encryption methods are supported?',
      description: 'Asymmetric encryption is supported (using public-private key pairs).'
    },
    {
      icon: '/FileTypeSupport.svg',
      title: 'What file types are supported?',
      description: 'Common document, image, archive, audio, and video formats are supported. A single file can be up to 100MB, and text is limited to 10,000 characters.'
    },
    {
      icon: '/PublicKeyLink.svg',
      title: 'Public key link encryption',
      description: 'You can share a public key link to allow others to encrypt documents and send them to you securely.'
    }
  ],
  'FAQ': [
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'Do I need to create my own keys?',
      answer: 'Yes. If you want to encrypt files or receive encrypted files from others, we recommend creating your own key pair.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'How do I share my public key?',
      answer: 'After creating a key pair, you can copy the public key or the generated public key link for others to use.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'What if I forget my private key or password?',
      answer: 'We cannot retrieve your private key or password. Please back them up safely and do not share them. Without them, you cannot decrypt data.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'Do I need to enter the security password every time?',
      answer: 'Yes. To ensure security, you must enter your password each time you access the Keys section.'
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      question: 'What if I forget the security password?',
      answer: 'You can reset your account to set a new security password. Be sure to back up your data before resetting, and you can later import it to restore your key data.'
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
      description: 'No. All encryption/decryption operations are performed locally in your browser. No data is uploaded or stored.'
    },
    {
      icon: '/EndToEndEncryption.svg',
      title: 'Can you access my private key?',
      description: 'No. The private key is stored locally and protected by your security password. We cannot access or read it.'
    }
  ],
  'Privacy': [
    {
      icon: '/PrivacyTracking.svg',
      title: 'Do you track my usage?',
      description: 'No. This tool does not track, store, or upload any user data. It operates entirely locally for complete privacy protection.'
    },
    {
      icon: '/KeyDeletion.svg',
      title: 'How can I completely remove my keys?',
      description: 'You can delete your key pair in the key management section. Once deleted, it cannot be recovered. You can also reset your account to remove all key data.'
    }
  ]
}

// Helper function to check if item is FAQ type
const isFAQItem = (item: ContentItem): item is FAQContentItem => {
  return 'question' in item && 'answer' in item && 'sub_icon' in item
}

// Component for rendering individual content items
const ContentCard = ({ item, index, isGridLayout }: {
  item: ContentItem
  index: number
  isGridLayout: boolean
}) => {
  if (isGridLayout) {
    return (
      <div
        className="flex items-center flex-col bg-[#F6F4F180] dark:bg-[#13141680] rounded-lg p-3 sm:p-4 transform transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-600 animate-in slide-in-from-bottom-8 fade-in"
        style={{
          animationDelay: `${index * 150}ms`
        }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 hover:rotate-12">
          <img
            src={item.icon}
            alt={item.title || 'Icon'}
            width={36}
            height={36}
            className="w-9 h-9 sm:w-12 sm:h-12"
          />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2 sm:mb-3 text-center transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center transition-colors duration-300">
          {item.description}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3 sm:space-x-4 bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg transform transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-600 animate-in slide-in-from-left-8 fade-in"
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
        <img
          src={item.icon}
          alt={item.title || 'Icon'}
          width={36}
          height={36}
          className="w-9 h-9 sm:w-12 sm:h-12"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 mb-1 sm:mb-2 transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed transition-colors duration-300">
          {item.description}
        </p>
      </div>
    </div>
  )
}

// Component for rendering FAQ items
const FAQCard = ({ item, index }: { item: FAQContentItem; index: number }) => (
  <div
    className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg transform transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-600 animate-in fade-in slide-in-from-bottom-4"
    style={{
      animationDelay: `${index * 150}ms`
    }}
  >
    <div className="flex items-center space-x-2 sm:space-x-3">
      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <img
          src={item.icon}
          alt="Question Icon"
          width={16}
          height={16}
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">
        {item.question}
      </h3>
    </div>
    <div className="flex items-start space-x-2 sm:space-x-3">
      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <img
          src={item.sub_icon}
          alt="Answer Icon"
          width={16}
          height={16}
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
        {item.answer}
      </p>
    </div>
  </div>
)

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<ContentKey>('Getting Started')

  const currentContent = useMemo(() => CONTENT[activeTab], [activeTab])
  const isGridLayout = useMemo(() => GRID_LAYOUT_TABS.includes(activeTab), [activeTab])
  const isFAQTab = useMemo(() => activeTab === 'FAQ', [activeTab])

  const renderContent = () => {
    if (isFAQTab) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          {currentContent.map((item, index) => {
            if (isFAQItem(item)) {
              return <FAQCard key={index} item={item} index={index} />
            }
            return null
          })}
        </div>
      )
    }

  const containerClass = isGridLayout
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-[#fff] dark:bg-[#282B30] rounded-xl p-4 sm:p-6'
    : 'bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6'

    return (
      <div className={containerClass}>
        {currentContent.map((item, index) => (
          <ContentCard
            key={index}
            item={item}
            index={index}
            isGridLayout={isGridLayout}
          />
        ))}
      </div>
    )
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-[#f5f3f0] dark:bg-[#0E0F11]">
      <div className="max-w-[100vw] sm:max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-200 mb-8 sm:mb-12">
          How It Works
        </h2>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {TABS.map((tab) => (
            <Button
              size="sm"
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className={cn(
                'px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-colors border-none shadow-none',
                activeTab === tab
                  ? 'bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-700'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
