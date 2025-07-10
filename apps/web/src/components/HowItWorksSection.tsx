'use client'

import {
  Button,
  cn
} from '@nsiod/share-ui'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState, useMemo } from 'react'

// Type definitions
type ContentKey =
  | 'gettingStarted'
  | 'usageScenarios'
  | 'features'
  | 'faq'
  | 'dataSecurity'
  | 'privacy'

interface BaseContentItem {
  icon: string
  titleKey: string
  descriptionKey: string
}

interface FAQContentItem extends BaseContentItem {
  questionKey: string
  answerKey: string
  sub_icon: string
}

type ContentItem = BaseContentItem | FAQContentItem

type Content = Record<ContentKey, ContentItem[]>

// Constants
const TABS: ContentKey[] = [
  'gettingStarted',
  'usageScenarios',
  'features',
  'faq',
  'dataSecurity',
  'privacy'
]

const GRID_LAYOUT_TABS = ['gettingStarted', 'usageScenarios', 'dataSecurity', 'privacy']

const CONTENT: Content = {
  'gettingStarted': [
    {
      icon: '/KeyCreation.svg',
      titleKey: 'gettingStarted.keyCreation.title',
      descriptionKey: 'gettingStarted.keyCreation.description'
    },
    {
      icon: '/FileEncryption.svg',
      titleKey: 'gettingStarted.fileEncryption.title',
      descriptionKey: 'gettingStarted.fileEncryption.description'
    },
    {
      icon: '/FileDecryption.svg',
      titleKey: 'gettingStarted.fileDecryption.title',
      descriptionKey: 'gettingStarted.fileDecryption.description'
    },
    {
      icon: '/TextEncryption.svg',
      titleKey: 'gettingStarted.textEncryption.title',
      descriptionKey: 'gettingStarted.textEncryption.description'
    }
  ],
  'usageScenarios': [
    {
      icon: '/SendFiles.svg',
      titleKey: 'usageScenarios.sendFiles.title',
      descriptionKey: 'usageScenarios.sendFiles.description'
    },
    {
      icon: '/EncryptFiles.svg',
      titleKey: 'usageScenarios.encryptFiles.title',
      descriptionKey: 'usageScenarios.encryptFiles.description'
    },
    {
      icon: '/QuickEncrypt.svg',
      titleKey: 'usageScenarios.quickEncrypt.title',
      descriptionKey: 'usageScenarios.quickEncrypt.description'
    },
    {
      icon: '/ArchiveFiles.svg',
      titleKey: 'usageScenarios.archiveFiles.title',
      descriptionKey: 'usageScenarios.archiveFiles.description'
    }
  ],
  'features': [
    {
      icon: '/EncryptionMethod.svg',
      titleKey: 'features.encryptionMethod.title',
      descriptionKey: 'features.encryptionMethod.description'
    },
    {
      icon: '/FileTypeSupport.svg',
      titleKey: 'features.fileTypeSupport.title',
      descriptionKey: 'features.fileTypeSupport.description'
    },
    {
      icon: '/PublicKeyLink.svg',
      titleKey: 'features.publicKeyLink.title',
      descriptionKey: 'features.publicKeyLink.description'
    }
  ],
  'faq': [
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.createKeys.question',
      answerKey: 'faq.createKeys.answer',
      titleKey: '',
      descriptionKey: ''
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.sharePublicKey.question',
      answerKey: 'faq.sharePublicKey.answer',
      titleKey: '',
      descriptionKey: ''
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.forgotKey.question',
      answerKey: 'faq.forgotKey.answer',
      titleKey: '',
      descriptionKey: ''
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.enterPasswordEveryTime.question',
      answerKey: 'faq.enterPasswordEveryTime.answer',
      titleKey: '',
      descriptionKey: ''
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.forgotSecurityPassword.question',
      answerKey: 'faq.forgotSecurityPassword.answer',
      titleKey: '',
      descriptionKey: ''
    },
    {
      icon: '/Question.svg',
      sub_icon: '/Answer.svg',
      questionKey: 'faq.multipleFiles.question',
      answerKey: 'faq.multipleFiles.answer',
      titleKey: '',
      descriptionKey: ''
    }
  ],
  'dataSecurity': [
    {
      icon: '/LocalProcessing.svg',
      titleKey: 'dataSecurity.localProcessing.title',
      descriptionKey: 'dataSecurity.localProcessing.description'
    },
    {
      icon: '/EndToEndEncryption.svg',
      titleKey: 'dataSecurity.endToEndEncryption.title',
      descriptionKey: 'dataSecurity.endToEndEncryption.description'
    }
  ],
  'privacy': [
    {
      icon: '/PrivacyTracking.svg',
      titleKey: 'privacy.tracking.title',
      descriptionKey: 'privacy.tracking.description'
    },
    {
      icon: '/KeyDeletion.svg',
      titleKey: 'privacy.keyDeletion.title',
      descriptionKey: 'privacy.keyDeletion.description'
    }
  ]
}

// Helper function to check if item is FAQ type
const isFAQItem = (item: ContentItem): item is FAQContentItem => {
  return 'questionKey' in item && 'answerKey' in item && 'sub_icon' in item
}

// Component for rendering individual content items
const ContentCard = ({
  item,
  index,
  isGridLayout
}: {
  item: ContentItem
  index: number
  isGridLayout: boolean
}) => {
  const t = useTranslations('howItWorks')

  if (isGridLayout) {
    return (
      <div
        className="flex items-center flex-col bg-[#F6F4F180] dark:bg-[#13141680] rounded-lg p-3 sm:p-4 transform transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-600 animate-in slide-in-from-bottom-8 fade-in"
        style={{
          animationDelay: `${index * 150}ms`
        }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 hover:rotate-12">
          <Image
            src={item.icon}
            alt={t(item.titleKey) || 'Icon'}
            width={36}
            height={36}
            className="w-9 h-9 sm:w-12 sm:h-12"
          />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2 sm:mb-3 text-center transition-colors duration-300">
          {t(item.titleKey)}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center transition-colors duration-300">
          {t(item.descriptionKey)}
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
        <Image
          src={item.icon}
          alt={t(item.titleKey) || 'Icon'}
          width={36}
          height={36}
          className="w-9 h-9 sm:w-12 sm:h-12"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300 mb-1 sm:mb-2 transition-colors duration-300">
          {t(item.titleKey)}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed transition-colors duration-300">
          {t(item.descriptionKey)}
        </p>
      </div>
    </div>
  )
}

// Component for rendering FAQ items
const FAQCard = ({
  item,
  index
}: {
  item: FAQContentItem;
  index: number;
}) => {
  const t = useTranslations('howItWorks')

  return (
    <div
      className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg transform transition-all duration-500 ease-out hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-600 animate-in fade-in slide-in-from-bottom-4"
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Image
            src={item.icon}
            alt="Question Icon"
            width={16}
            height={16}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">
          {t(item.questionKey)}
        </h3>
      </div>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Image
            src={item.sub_icon}
            alt="Answer Icon"
            width={16}
            height={16}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
          {t(item.answerKey)}
        </p>
      </div>
    </div>
  )
}

export default function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const [activeTab, setActiveTab] = useState<ContentKey>('gettingStarted')

  const currentContent = useMemo(() => CONTENT[activeTab], [activeTab])
  const isGridLayout = useMemo(() => GRID_LAYOUT_TABS.includes(activeTab), [activeTab])
  const isFAQTab = useMemo(() => activeTab === 'faq', [activeTab])

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
          {t('title')}
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
              {t(`tabs.${tab}`)}
            </Button>
          ))}
        </div>

        {renderContent()}
      </div>
    </section>
  )
}
